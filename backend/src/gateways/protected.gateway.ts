import type { SessionObject } from "src/services/session.service";
import type { Server, Socket } from "socket.io";
import { Inject } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, WsException } from "@nestjs/websockets";
import { FRONTEND_ADDRESS } from "../vars";
import { User } from "src/entities/User";
import { Repository } from "typeorm";
import { authenticate } from "src/auth/authenticate";
import { validate_id } from "src/util";

declare module "http" {
	export interface IncomingMessage {
		session: SessionObject;
	}
}

declare module "socket.io" {
	export interface Socket {
		user?: number,
		room?: number;
	}
}

export function ProtectedGateway(namespace?: string) {
	@WebSocketGateway({
		namespace,
		cors: {
			origin: FRONTEND_ADDRESS,
			credentials: true,
		}
	})
	class ProtectedGatewayFactory {
		@WebSocketServer()
		readonly server: Server;

		constructor(@Inject("USER_REPO") readonly userRepo: Repository<User>) {}

		async handleConnection(client: Socket) {
			const user = await authenticate(client.request, this.userRepo);
		
			if (!user) {
				client.emit("exception", { errorMessage: "unauthorized" });
				client.disconnect();
				return;
			}

			client.user = user.id;
			
			await this.onConnect(client);
		}

		async handleDisconnect(client: Socket) {
			if (client.user) {
				await this.onDisconnect(client);
			}
		}

		@SubscribeMessage("join")
		async join(@ConnectedSocket() client: Socket, @MessageBody() data: { id: number }) {
			await authenticate(client.request, this.userRepo);
		
			try {
				client.room = validate_id(data.id);
			} catch (error) {
				throw new WsException(error.message);
			}

			await client.join(String(client.room));

			await this.onJoin(client);

			return "joined";
		}

		async onConnect(client: Socket) {}
		async onDisconnect(client: Socket) {}
		async onJoin(client: Socket) {}
	}

	return ProtectedGatewayFactory;
}

