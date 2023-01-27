import { Inject } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { User } from "../entities/User";
import { Repository } from "typeorm"
import { instanceToPlain } from "class-transformer";
import { ProtectedGateway } from "./protected.gateway";

export class UpdateGateway extends ProtectedGateway("update") {

	//TODO purge inactive sockets?
	private readonly sockets = new Map<number, Socket[]>();

	constructor() {
		super();
	}

	async onConnect(client: Socket) {
		console.log("connect");
		const id = client.request.session.user_id;
		if (!this.sockets.has(id))
			this.sockets.set(id, []);
		if (this.sockets.get(id).length === 0) {
			//const user = await this.user_repo.findOneBy({ id: id });
			//user.has_session = true;
			//await this.user_repo.save(user);
		}
		this.sockets.get(id).push(client);
	}

	async onDisonnect(client: Socket) {
		console.log("hi");
		const id = client.request.session.user_id;
		const sockets = this.sockets.get(id);
		const idx = sockets.findIndex(socket => socket.request.session.id === socket.request.session.id);
		if (idx < 0)
			console.error("could not find socket");
		else {
			sockets.splice(idx, 1);
			//todo also make sure that retrieving the user with the databases returns offline 
			console.log(sockets.length);
			if (sockets.length === 0) {
				console.log("last socket");
				//const user = await this.user_repo.findOneBy({ id: id });
				//user.has_session = false;
				//await this.user_repo.save(user);
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
