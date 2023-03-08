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

		constructor(
			@Inject("USER_REPO")
			readonly users: Repository<User>,
		) {}

		async handleConnection(client: Socket) {
			if (!await authenticate(client.request?.session, this.users)) {
				client.emit("exception", { errorMessage: "unauthorized" });
				client.disconnect();
				return;
			}
			this.onConnect(client);
		}

		async handleDisconnect(client: Socket) {
			if (await authenticate(client.request?.session, this.users)) {
				this.onDisconnect(client);
			}

			const id = client.request.session.user_id;

			if (id) {
				await this.users.save({ id, activeRoom: null });
			}
		}

		@SubscribeMessage("join")
		async onJoin(@ConnectedSocket() client: Socket, @MessageBody() id: string) {
			try {
				client.room = validate_id(id);
			} catch (error) {
				throw new WsException(error.message);
			}
		
			const user = await this.users.findOneBy({ id: client.request.session.user_id });

			user.activeRoom = null;
			
			await this.users.save(user);
		}
	

		async onConnect(client: Socket) {}
		async onDisconnect(client: Socket) {}
	}
	return ProtectedGatewayFactory;
}

