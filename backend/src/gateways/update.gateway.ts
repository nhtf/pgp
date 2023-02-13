import { Inject, UseInterceptors, ClassSerializerInterceptor } from "@nestjs/common";
import type { Socket } from "socket.io";
import type { User } from "../entities/User";
import { Repository } from "typeorm"
import { instanceToPlain } from "class-transformer";
import type { SessionObject } from "src/services/session.service";
import { Status } from "src/enums/Status";
import { ProtectedGateway } from "src/gateways/protected.gateway";
import { PURGE_INTERVAL } from "../vars";
import { Subject } from "src/enums/Subject";
import { Action } from "src/enums/Action";
import { get_status } from "./get_status";

export interface UpdatePacket {
	subject: Subject;
	identifier?: number;
	action: Action;
	value?: any;
}

declare module "http" {
	export interface IncomingMessage {
		session: SessionObject;
	}

}

function create_status_update(user: User | number, status: Status) {
	return {
		subject: Subject.STATUS,
		identifier: typeof user === "number" ? user : user.id,
		action: Action.SET,
		value: status,
	};
}

@UseInterceptors(ClassSerializerInterceptor)
export class UpdateGateway extends ProtectedGateway("update") {
	//TODO purge inactive sockets?
	private readonly sockets = new Map<number, Socket[]>();
	private readonly activity_map = new Map<number, { last_status: Status, last_activity: number}>();

	static instance: UpdateGateway;

	constructor(
		@Inject("USER_REPO")
		private readonly user_repo: Repository<User>,
	) {
		setInterval(async () => {
			await this.tick();
		}, PURGE_INTERVAL);
		super(user_repo);
		UpdateGateway.instance = this;
	}

	async tick() {
		const now = Date.now();
		for (const id of this.activity_map.keys()) {
			const { last_status, last_activity } = this.activity_map.get(id);
			const new_status = get_status(last_activity, now);
			if (new_status !== last_status) {
				if (new_status == Status.OFFLINE)
					await this.expire(id);
				else
					await this.send_update(create_status_update(id, new_status));
			}
		}
	}

	async expire(user: User | number) {
		const id = (typeof user === "number" ? user : user.id);
		this.activity_map.delete(id);
		await this.send_update(create_status_update(id, Status.OFFLINE));
	}

	async onConnect(client: Socket) {
		const id = client.request.session.user_id;
		if (!this.sockets.has(id))
			this.sockets.set(id, []);
		if (this.sockets.get(id).length === 0) {
			const user = await this.user_repo.findOneBy({ id: id });
			user.has_session = true;
			await this.heartbeat(user);
			//await this.user_repo.save(user);
			//await this.send_update(create_status_update(user, Status.ACTIVE));
		}
		this.sockets.get(id).push(client);
	}

	async onDisconnect(client: Socket) {
		const id = client.request.session.user_id;
		const sockets = this.sockets.get(id);
		const idx = sockets.findIndex(socket => socket.request.session.id === socket.request.session.id);
		if (idx < 0)
			console.error("could not find socket");
		else {
			sockets.splice(idx, 1);
			if (sockets.length === 0) {
				const user = await this.user_repo.findOneBy({ id: id });
				user.has_session = false;
				await this.user_repo.save(user);
				await this.expire(user);
			}
		}
	}

	async send_update(packet: UpdatePacket, ...receivers: User[] | number[]) {
		if (receivers === undefined || receivers === null || receivers.length === 0) {
			this.server.emit("update", packet);
		} else {
			for (const receiver of receivers) {
				if (receiver === undefined || receiver === null)
					continue;
				const id = typeof receiver === "number" ? receiver : receiver.id;
				this.sockets.get(id)?.forEach(socket => socket.emit("update", packet));
			}
		}
	}

	async update_user(user: User) {
		this.server.serverSideEmit("update", instanceToPlain(user));
	}

	async update_user_partial(id: number, changes: Partial<User>, to?: User | number) {
		if (to === undefined) {
			changes.id = id;
			this.server.emit("update", changes);
		} else {
			const to_id = typeof to === "number" ? to : to.id;
			console.log(changes);
			//await this.sockets.get(to_id)?.at(0).emit("update", changes);
			//await this.sockets.get(to_id)?.forEach(async a => await a.emit("update", changes));
		}
	}

	async heartbeat(user: User | number) {
		if (typeof user === "number")
			user = await this.user_repo.findOneBy({ id: user });
		user.last_activity = new Date();
		const last_status = this.activity_map.get(user.id)?.last_status;
		this.activity_map.set(user.id, { last_status: Status.ACTIVE, last_activity: user.last_activity.getTime()});
		if (last_status !== Status.ACTIVE) {
			await this.send_update(create_status_update(user, Status.ACTIVE));
		}
		await this.user_repo.save(user);
	}
}
