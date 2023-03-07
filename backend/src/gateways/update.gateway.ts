import type { Socket } from "socket.io";
import type { User } from "../entities/User";
import type { SessionObject } from "src/services/session.service";
import { Inject, UseInterceptors, ClassSerializerInterceptor } from "@nestjs/common";
import { Repository, In } from "typeorm"
import { Status } from "src/enums/Status";
import { ProtectedGateway } from "src/gateways/protected.gateway";
import { PURGE_INTERVAL } from "../vars";
import { Subject } from "src/enums/Subject";
import { Action } from "src/enums/Action";
import { WsException, SubscribeMessage, ConnectedSocket } from "@nestjs/websockets";

export interface UpdatePacket {
	subject: Subject;
	id: number;
	action: Action;
	value?: any;
}

declare module "http" {
	export interface IncomingMessage {
		session: SessionObject;
	}
}

@UseInterceptors(ClassSerializerInterceptor)
export class UpdateGateway extends ProtectedGateway("update") {
	//TODO purge inactive sockets?
	private readonly sockets = new Map<number, Socket[]>();
	private readonly status = new Map<number, Status>();

	static instance: UpdateGateway;

	constructor(@Inject("USER_REPO") private readonly user_repo: Repository<User>) {
		super(user_repo);
		UpdateGateway.instance = this;
		setInterval(this.tick.bind(this), PURGE_INTERVAL);
	}

	async onConnect(client: Socket) {
		const id = client.request.session.user_id;
		const user = await this.user_repo.findOneBy({ id });
		const now = new Date;

		user.has_session = true;
		user.last_activity = now;

		await this.user_repo.save(user);

		if (!this.sockets.has(id)) {
			this.sockets.set(id, []);
			this.status.set(id, Status.OFFLINE);
		}

		this.sockets.get(id).push(client);

		this.update(user);
	}

	async onDisconnect(client: Socket) {
		const id = client.request.session.user_id;
		const sockets = this.sockets.get(id);
		const index = sockets.findIndex((socket) => socket.request.session.id === client.request.session.id);

		if (index < 0) {
			throw new WsException("could not find socket");
		}

		sockets.splice(index, 1);

		if (!sockets.length) {
			let user = await this.user_repo.findOneBy({ id });

			user.has_session = false;
			user = await this.user_repo.save(user);
			user.send_update();

			this.status.delete(user.id);
		}
	}

	send_update(packet: UpdatePacket, ...receivers: User[]) {
		if (!receivers.length) {
			this.server.emit("update", packet);
		}

		for (const receiver of receivers) {
			this.sockets.get(receiver.id)?.forEach((socket) => socket.emit("update", packet));
		}
	}

	async tick() {
		const ids = Array.from(this.status.keys())
		const users = await this.user_repo.find({ where: { id: In(ids) } });

		users.forEach((user) => this.update(user));
	}

	update(user: User) {
		const last_status = this.status.get(user.id) ?? Status.OFFLINE;

		if (user.status !== last_status) {
			user.send_update();

			this.status.set(user.id, user.status);
		}
	}

	async heartbeat(user: User) {
		user = await this.setActive(user);

		this.update(user);
	}

	async setActive(user: User) {
		user.last_activity = new Date;

		return await this.user_repo.save(user);
	}

	@SubscribeMessage("heartbeat")
	async receiveHeartbeat(@ConnectedSocket() client: Socket) {
		const id = client.request.session.user_id;
		const user = await this.user_repo.findOneBy({ id });

		await this.heartbeat(user);
	}

}
