import { Inject } from "@nestjs/common";
import { User } from "src/entities/User";
import { Team } from "src/entities/Team";
import { MessageBody, SubscribeMessage, ConnectedSocket, WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { Repository } from "typeorm"
import { validate_id } from "src/util";
import { GameRoom } from "src/entities/GameRoom";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { Subject } from "src/enums/Subject";
import { Action } from "src/enums/Action";
import { instanceToPlain } from "class-transformer";
import { ProtectedGateway } from "src/gateways/protected.gateway";
import { UpdateGateway } from "src/gateways/update.gateway"

export class GameGateway extends ProtectedGateway("game") {
	constructor(
		@Inject("USER_REPO")
		private readonly user_repo: Repository<User>,
		@Inject("GAMEROOM_REPO")
		private readonly room_repo: Repository<GameRoom>,
		@Inject("GAMEROOMMEMBER_REPO")
		private readonly member_repo: Repository<GameRoomMember>,
		@Inject("TEAM_REPO")
		private readonly team_repo: Repository<Team>,
	) {
		super(user_repo);
	}

	async getRoom(id: number) {
		return await this.room_repo.findOne({
			where: { id },
			relations: {
				members: {
					user: true
				},
				state: {
					teams: true,
				}
			}
		});
	}

	async onConnect(client: Socket) {
		const req = client.request as any;

		if (!req.session.user_id) {
			client.disconnect();
			return;
		}
	
		// TODO: is this even used?
		req.user = await this.user_repo.findOneBy({
			id: req.session.user_id
		});
	}

	async onDisconnect(client: Socket) {
		const id = client.request.session.user_id;
		const member = await this.member_repo.findOneBy({
			room: {
				id: client.room,
			},
			user: {
				id: client.request.session.user_id,
			},
		});

		if (member !== null) {
			member.is_playing = false;
			await this.member_repo.save(member);
		}
	
		let user = await this.user_repo.findOneBy({ id });

		user.activeRoom = null;
		user = await this.user_repo.save(user);
		user.send_update();
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
				const room = await this.getRoom(client.room);
				const team = await this.team_repo.findOneBy({
					id: teamState.id,
					state: {
						room: {
							id: client.room
						}
					}
				});

				if (team?.score !== teamState.score) {
					team.score = teamState.score;
					await this.team_repo.save(team);

					// room.send_update({
					// 	subject: Subject.ROOM,
					// 	id: client.room,
					// 	action: Action.SET,
					// 	value: instanceToPlain(room),
					// }, !room.is_private);
				}
			}
		}
	}

	@SubscribeMessage("ping")
	ping(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		client.emit("pong", data);
	}

	@SubscribeMessage("join")
	async join(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string, scope: string }) {
		let roomId: number;
	
		if (data.scope === "game") {
			if (client.room !== undefined) {
				return;
			}

			try {
				const request = client.request as any;
				roomId = validate_id(data.room);

				const member = await this.member_repo.findOneBy({
					room: {
						id: roomId,
					},
					user: {
						id: client.request.session.user_id,
					},
				});

				if (!member) {
					throw new WsException("Invalid room id");
				}

				client.room = roomId;
				client.join(data.scope + "-" + roomId);

				member.is_playing = true;
				await this.member_repo.save(member);
			} catch (err) {
				throw new WsException(err.message);
			}
		}

		const id = client.request.session.user_id;

		if (!id) {
			throw new WsException("UNAUTHORIZED");
		}

		try {
			roomId = validate_id(data.room);
		} catch (error) {
			throw new WsException("Invalid room id");
		}

		const room = await this.room_repo.findOneBy({ id: roomId });
		let user = await this.user_repo.findOneBy({ id });

		user.activeRoom = room;
		user = await this.user_repo.save(user);
		user.send_update();
	}
}
