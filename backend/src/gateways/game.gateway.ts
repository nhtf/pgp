import { Inject } from "@nestjs/common";
import { User } from "src/entities/User";
import { Team } from "src/entities/Team";
import { MessageBody, SubscribeMessage, WebSocketGateway, ConnectedSocket, WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { Repository } from "typeorm"
import { validate_id } from "src/util";
import { GameRoom } from "src/entities/GameRoom";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { FRONTEND_ADDRESS } from "src/vars";
import { Subject } from "src/enums/Subject";
import { Action } from "src/enums/Action";
import { instanceToPlain } from "class-transformer";

@WebSocketGateway({
	namespace: "game", 
	cors: { origin: FRONTEND_ADDRESS, credentials: true },
})
export class GameGateway {
	constructor(
		@Inject("USER_REPO")
		private readonly user_repo: Repository<User>,
		@Inject("GAMEROOM_REPO")
		private readonly room_repo: Repository<GameRoom>,
		@Inject("GAMEROOMMEMBER_REPO")
		private readonly member_repo: Repository<GameRoomMember>,
		@Inject("TEAM_REPO")
		private readonly team_repo: Repository<Team>,
	) {}

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

	async handleConnection(@ConnectedSocket() client: Socket) {
		const req = client.request as any;

		if (!req.session.user_id) {
			client.disconnect();
			return;
		}
	
		req.user = await this.user_repo.findOneBy({
			id: req.session.user_id
		});
	}

	async handleDisconnect(@ConnectedSocket() client: Socket) {
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
				const team = await this.team_repo.findOneBy({ id: teamState.id, state: { room: { id: client.room } } });
				const room = await this.getRoom(client.room);

				if (room !== null && team !== null && team.score != teamState.score) {
					team.score = teamState.score;
					await this.team_repo.save(team);

					room.send_update({
						subject: Subject.ROOM,
						id: client.room,
						action: Action.SET,
						value: instanceToPlain(room),
					}, !room.is_private);
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
		if (data.scope === "game") {
			if (client.room !== undefined) {
				return;
			}

			try {
				const request = client.request as any;
				const roomId = validate_id(data.room);

				const member = await this.member_repo.findOneBy({
					room: {
						id: roomId,
					},
					user: {
						id: client.request.session.user_id,
					},
				});

				if (member === null) {
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
	}
}
