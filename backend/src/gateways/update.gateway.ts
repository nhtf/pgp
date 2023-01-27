import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Inject, UseGuards } from "@nestjs/common";
import type { Server, Socket } from "socket.io";
import type { User } from "../entities/User";
import { Repository } from "typeorm"
import { instanceToPlain } from "class-transformer";
import { FRONTEND_ADDRESS } from "../vars";
import type { SessionObject } from "src/services/session.service";
import { Status } from "src/enums/Status";
import { ProtectedGateway } from "src/gateways/protected.gateway";

declare module "http" {
	export interface IncomingMessage {
		session: SessionObject;
	}

}

export class UpdateGateway extends ProtectedGateway("update") {
	//TODO purge inactive sockets?
	private readonly sockets = new Map<number, Socket[]>();

	constructor(
		@Inject("USER_REPO")
		private readonly user_repo: Repository<User>,
	) {
		super(user_repo);
	}

	async onConnect(client: Socket) {
		const id = client.request.session.user_id;
		if (!this.sockets.has(id))
			this.sockets.set(id, []);
		if (this.sockets.get(id).length === 0) {
			const user = await this.user_repo.findOneBy({ id: id });
			user.has_session = true;
			await this.user_repo.save(user);
		}
		this.sockets.get(id).push(client);
	}

	async onDisconnect(client: Socket) {
		const id = client.request.session.user_id;
		const sockets = this.sockets.get(id);
		const idx = sockets.findIndex(socket => socket.request.session.id === socket.request.session.id);
		console.log(id);
		if (idx < 0)
			console.error("could not find socket");
		else {
			sockets.splice(idx, 1);
			if (sockets.length === 0) {
				const user = await this.user_repo.findOneBy({ id: id });
				user.has_session = false;
				await this.user_repo.save(user);
				await this.update_user_partial(id, { status: Status.OFFLINE });
			}
		}
	}

	async update_user(user: User) {
		await this.server.serverSideEmit("update", instanceToPlain(user));
	}

	async update_user_partial(id: number, changes: Partial<User>) {
		changes.id = id;
		await this.server.emit("update", changes);
	}
}
