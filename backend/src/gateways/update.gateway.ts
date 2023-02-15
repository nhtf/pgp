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
import { WsException } from "@nestjs/websockets";

export type Activity = {
	last_status: Status,
	last_activity: Date,
}

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

@UseInterceptors(ClassSerializerInterceptor)
export class UpdateGateway extends ProtectedGateway("update") {
	//TODO purge inactive sockets?
	private readonly sockets = new Map<number, Socket[]>();
	private readonly activity_map = new Map<number, Activity>();

	static instance: UpdateGateway;

	constructor(
		@Inject("USER_REPO")
		private readonly user_repo: Repository<User>,
	) {
		setInterval(async () => await this.tick(), PURGE_INTERVAL);
		super(user_repo);
		UpdateGateway.instance = this;
	}

	// TODO: remove status
	create_update(user: User, status: Status) {
		return {
			subject: Subject.USER,
			identifier: user.id,
			action: Action.SET,
			value: instanceToPlain(user),
		};
	}

	async update(user: User) {
		const last_status = this.activity_map.get(user.id).last_status;
	
		if (last_status !== user.status) {
			console.log(`${user.username}: ${Status[last_status]} -> ${Status[user.status]}`);
			await this.send_update(this.create_update(user, Status.ACTIVE));
		}

		
	}

	async tick() {
		for (const [id, activity] of this.activity_map) {
			const new_status = get_status(activity.last_activity);
		
			if (new_status !== activity.last_status) {
				const user = await this.user_repo.findOneBy({ id });

				await this.send_update(this.create_update(user, new_status));
			
				this.activity_map.set(id, { last_status: new_status, last_activity: activity.last_activity });
			
				if (new_status === Status.OFFLINE) {
					this.activity_map.delete(user.id);
				}
			}
		}
	}

	async expire(user: User) {
		this.activity_map.delete(user.id);
	
		await this.send_update(this.create_update(user, Status.OFFLINE));
	}

	async onConnect(client: Socket) {
		const id = client.request.session.user_id;
		const user = await this.user_repo.findOneBy({ id });

		user.has_session = true;

		await this.user_repo.save(user);
		await this.setActivity(user);

		if (!this.sockets.has(id)) {
			this.sockets.set(id, []);
		}
	
		if (this.sockets.get(id).length === 0) {
			await this.heartbeat(user);
		}
	
		this.sockets.get(id).push(client);
	}

	async onDisconnect(client: Socket) {
		const id = client.request.session.user_id;
		const sockets = this.sockets.get(id);
		const index = sockets.findIndex((socket) => socket.request.session.id === socket.request.session.id);
	
		if (index < 0) {
			console.error("could not find socket");
			throw new WsException("could not find socket");
		}
	
		sockets.splice(index, 1);
		if (sockets.length === 0) {
			const user = await this.user_repo.findOneBy({ id });
		
			user.has_session = false;
		
			await this.user_repo.save(user);
			await this.expire(user);
		}
	}

	async send_update(packet: UpdatePacket, ...receivers: User[]) {
		if (receivers === undefined || receivers === null || receivers.length === 0) {
			this.server.emit("update", packet);
		} else {
			for (const receiver of receivers) {
				this.sockets.get(receiver.id)?.forEach(socket => socket.emit("update", packet));
			}
		}
	}

	async heartbeat(user: User) {
		const activity = this.activity_map.get(user.id);
		const last_status = activity ? activity.last_status : Status.OFFLINE;
	
		user = await this.setActivity(user);

	
		if (last_status !== user.status) {
			await this.send_update(this.create_update(user, Status.ACTIVE));
		}
	
		await this.user_repo.save(user);
	}

	async setActivity(user: User) {
		const now = new Date;
	
		user.last_activity = now;
		
		this.activity_map.set(user.id, { last_status: user.status, last_activity: now })
	
		return await this.user_repo.save(user);
	}
}
