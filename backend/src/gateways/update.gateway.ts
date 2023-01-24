import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { FRONTEND_ADDRESS } from "../vars";
import { User } from "../entities/User";
import { instanceToPlain } from "class-transformer";

@WebSocketGateway({
	namespace: "update",
	cors: { origin: FRONTEND_ADDRESS, credentials: true }
})
export class UpdateGateway {
	@WebSocketServer()
	server: Server;

	static instance: UpdateGateway;

	constructor() {
		UpdateGateway.instance = this;
	}

	static async update_user(user: User) {
		await UpdateGateway.instance.server.serverSideEmit("update", instanceToPlain(user));
	}

	static async update_user_partial(id: number, changes: Partial<User>) {
		changes.id = id;
		await UpdateGateway.instance.server.emit("update", changes);
	}
}
