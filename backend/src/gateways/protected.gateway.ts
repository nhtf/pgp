import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import type { SessionObject } from "src/services/session.service";
import { authorize } from "src/auth/auth.guard";
import { FRONTEND_ADDRESS } from "../vars";

declare module "http" {
	export interface IncomingMessage {
		session: SessionObject;
	}
}

export function ProtectedGateway(namespace?: string) {
	@WebSocketGateway({
		namespace: namespace,
		cors: { origin: FRONTEND_ADDRESS, credentials: true }
	})
	class ProtectedGatewayFactory {
		@WebSocketServer()
		readonly server: Server;

		async handleConnection(client: Socket) {
			const session = client.request?.session;

			if (!session || !authorize(session)) {
				client.emit("exception", { errorMessage: "unauthorized" });
				client.disconnect();
			}
			this.onConnect(client);
		}

		async handleDisconnect(client: Socket) {
			this.onDisconnect(client);
		}

		async onConnect(client: Socket) {}
		async onDisconnect(client: Socket) {}
	}
	return ProtectedGatewayFactory;
}
