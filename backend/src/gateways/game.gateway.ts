import { Inject } from "@nestjs/common";
import { User } from "src/entities/User";
import { Team } from "src/entities/Team";
import { MessageBody, SubscribeMessage, ConnectedSocket, WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { Repository } from "typeorm"
import { GameRoom } from "src/entities/GameRoom";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { ProtectedGateway } from "src/gateways/protected.gateway";

export class GameGateway extends ProtectedGateway("game") {
	constructor(
		@Inject("USER_REPO")
		private readonly userRepo: Repository<User>,
		@Inject("GAMEROOM_REPO")
		private readonly roomRepo: Repository<GameRoom>,
		@Inject("GAMEROOMMEMBER_REPO")
		private readonly memberRepo: Repository<GameRoomMember>,
		@Inject("TEAM_REPO")
		private readonly teamRepo: Repository<Team>,
	) {
		super(userRepo);
	}

	async onConnect(client: Socket, user: User) {
		console.log("connect");
	}

	async onDisconnect(client: Socket, user: User) {
		console.log("disconnect");
		const member = await this.memberRepo.findOne({
			where: {
				room: {
					id: client.room,
				},
				user: {
					id: user.id,
				},
			},
			relations: {
				room: {
					members: {
						user: true,
					}
				}
			}
		});

		if (!member) {
			console.error("No member to disconnect");
			throw new WsException("Missing member on disconnect");
		}
		
		user.activeRoom = null;
		member.is_playing = false;
	
		await this.users.save(user);
		await this.memberRepo.save(member);
	}

	async onJoin(@ConnectedSocket() client: Socket, data: { id: number, scope: string }) {
		console.log("join");
		try {
			const member = await this.memberRepo.findOne({
				where: {
					room: {	id: data.id },
					user: {
						id: client.request.session.user_id,
					},
				},
				relations: {
					room: {
						members: {
							user: true,
						}
					}
				}
			});

			if (!member) {
				throw new WsException("Invalid room id");
			}

			client.join(data.scope + "-" + data.id);

			member.is_playing = true;
			await this.memberRepo.save(member);
		} catch (err) {
			throw new WsException(err.message);
		}
	}
	@SubscribeMessage("broadcast")
	async broadcast(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		if (client.room === undefined) {
			return;
		}

		client.to("game-" + client.room).emit("broadcast", data);

		if (data.name === "synchronize") {
			// TODO: the "stat-" rooms are obsolete
			client.to("stat-" + client.room).emit("status", data.snapshot.state);

			for (let teamState of data.snapshot.state?.teams || []) {
				const team = await this.teamRepo.findOneBy({
					id: teamState.id,
					state: {
						room: {
							id: client.room
						}
					}
				});

				if (team?.score !== teamState.score) {
					await this.teamRepo.save({ id: team.id, score: teamState.score });

					// room.send_update({
					// 	subject: Subject.ROOM,
					// 	id: client.room,
					// 	action: Action.SET,
					// 	value: instanceToPlain(room),
					// });
				}
			}
		}
	}

	@SubscribeMessage("ping")
	ping(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		client.emit("pong", data);
	}
}
