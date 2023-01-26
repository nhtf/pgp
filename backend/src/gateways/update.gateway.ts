import { Server, Socket } from "socket.io";
import { User } from "../entities/User";
import { instanceToPlain } from "class-transformer";
import { ProtectedGateway } from "./protected.gateway";
import { ActivityService } from "src/services/activity.service";

//TODO handle session expiration

//TODO this class also handles session expiry, it should probably be renamed
export class UpdateGateway extends ProtectedGateway("update") {
	static instance: UpdateGateway;

	//TODO purge inactive sockets?
	private readonly sockets = new Map<number, Socket[]>();

	constructor(private readonly activity_service: ActivityService) {
		super();
		if (UpdateGateway.instance)
			throw new Error("multiple instances of singleton UpdateGateway");
		UpdateGateway.instance = this;
	}

	async onConnect(client: Socket) {
		console.log("connect");
		const id = client.request.session.user_id;
		if (!this.sockets.has(id))
			this.sockets.set(id, []);
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
			if (sockets.length === 1) {
				console.log("last socket");
				this.activity_service.expire(id);
			}
		}
	}

	static async update_user(user: User) {
		await UpdateGateway.instance.server.serverSideEmit("update", instanceToPlain(user));
	}

	static async update_user_partial(id: number, changes: Partial<User>) {
		changes.id = id;
		await UpdateGateway.instance.server.emit("update", changes);
	}
}
