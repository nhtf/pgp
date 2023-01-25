import { dataSource } from "src/app.module";
import { User } from "src/entities/User";
import { MessageBody, SubscribeMessage, WebSocketGateway, ConnectedSocket } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { parseId } from "src/util";
import { Room } from "src/entities/Room";
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
	async handleConnection(@ConnectedSocket() client: Socket) {
		const req = client.request as any;

		if (!req.session.user_id) {
			client.disconnect();
			return;
		}
	
		req.user = await dataSource.getRepository(User).findOneBy({
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
			// TODO: only if room owner?
			client.to("stat-" + client.room).emit("status", data.snapshot.state);
		}
	}

	@SubscribeMessage("join")
	async join(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string, scope: string }) {
		if (data.scope === "game") {
			if (client.room !== undefined) {
				return;
			}

			// TODO: internal server error when not in room
			
			const request = client.request as any;
			const room = await parseId(Room, data.room);
			const members = await room.members;
			const users = await Promise.all(members.map(member => member.user));
			const index = users.findIndex(user => user.id === request.user.id);

			if (index < 0) {
				return;
			}

			client.room = data.room;
		}

		client.join(data.scope + "-" + data.room);
	}
}
