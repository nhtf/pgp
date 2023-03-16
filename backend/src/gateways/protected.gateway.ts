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
			
			this.onConnect(client, user);
		}

		async handleDisconnect(client: Socket) {
			const id = client.request.session.user_id;

			if (id) {
				const user = await this.userRepo.findOneBy({ id });

				if (user) {
					this.onDisconnect(client, user);
				}
			}
		}

		@SubscribeMessage("join")
		async join(@ConnectedSocket() client: Socket, @MessageBody() data: { id: number }) {
			const user = await authenticate(client.request, this.userRepo);
		
			try {
				client.room = validate_id(data.id);
			} catch (error) {
				throw new WsException(error.message);
			}

			await this.onJoin(client, user);
		}

		async onConnect(client: Socket, user: User) {}
		async onDisconnect(client: Socket, user: User) {}
		async onJoin(client: Socket, user: User) {}
	}

	return ProtectedGatewayFactory;
}

