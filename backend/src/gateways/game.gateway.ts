import { MessageBody, SubscribeMessage, WebSocketGateway, ConnectedSocket } from "@nestjs/websockets";
import { Socket } from "socket.io";

declare module "socket.io" {
	export interface Socket {
		room?: string;
	}
}

@WebSocketGateway({
	namespace: "game", 
	cors: { origin: "http://localhost:5173", credentials: true },
})
export class GameGateway {
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
	join(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string, scope: string }) {
		// TODO: check if rooms exists and is allowed to join
		// TODO: everyone (or maybe just friends) should be able to join rooms with "stat" scope
	
		if (data.scope === "game") {
			if (client.room !== undefined) {
				return;
			}

			client.room = data.room;
		}

		client.join(data.scope + "-" + data.room);
	}
}
