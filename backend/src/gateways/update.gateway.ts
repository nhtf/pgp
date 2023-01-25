import { Server, Socket } from "socket.io";
import { User } from "../entities/User";
import { instanceToPlain } from "class-transformer";
import { ProtectedGateway } from "./protected.gateway";

//TODO handle session expiration

//TODO this class also handles session expiry, it should probably be renamed
export class UpdateGateway extends ProtectedGateway("update") {
	static instance: UpdateGateway;

	//TODO purge inactive sockets?
	private readonly sockets = new Map<number, Socket>();

	constructor() {
		super();
		if (UpdateGateway.instance)
			throw new Error("multiple instances of singleton UpdateGateway");
		UpdateGateway.instance = this;
	}

	async onConnect(client: Socket) {
		this.sockets.set(client.request.session.user_id, client);
	}

	async onDisonnect(client: Socket) {
		this.sockets.delete(client.request.session.user_id);
	}

	static async update_user(user: User) {
		await UpdateGateway.instance.server.serverSideEmit("update", instanceToPlain(user));
	}

	static async update_user_partial(id: number, changes: Partial<User>) {
		changes.id = id;
		await UpdateGateway.instance.server.emit("update", changes);
	}
}
