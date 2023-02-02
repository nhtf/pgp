import { Inject } from "@nestjs/common";
import { User } from "src/entities/User";
import { MessageBody, SubscribeMessage, WebSocketGateway, ConnectedSocket, WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { Repository } from "typeorm"
import { validate_id } from "src/util";
import { GameRoom } from "src/entities/GameRoom";
import { FRONTEND_ADDRESS } from "src/vars";

declare module "socket.io" {
	export interface Socket {
		room?: string;
	}
}

@WebSocketGateway({
	namespace: "game", 
	cors: { origin: FRONTEND_ADDRESS, credentials: true },
})
export class GameGateway {

	constructor(
		@Inject("USER_REPO")
		private readonly user_repo: Repository<User>,
		@Inject("GAMEROOM_REPO")
		private readonly gameroom_repo: Repository<GameRoom>,
	) {}

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

	@SubscribeMessage("broadcast")
	broadcast(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		if (client.room === undefined) {
			return;
		}

		client.to("game-" + client.room).emit("broadcast", data);

		if (data.name === "synchronize") {
			// TODO: don't send too many updates, maybe only once every few seconds
			client.to("stat-" + client.room).emit("status", data.snapshot.state);
		}
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
				const room = await this.gameroom_repo.findOneBy({ id: roomId, members: { user: { id: client.request.session.user_id } } });

				if (room === null) {
					throw new WsException("Invalid room id");
				}

				client.room = data.room;
			} catch (err) {
				throw new WsException(err.message);
			}
		}

		client.join(data.scope + "-" + data.room);
	}
}
