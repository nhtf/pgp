import type { Socket } from "socket.io";
import type { User } from "src/entities/User";
import type { Room } from "src/entities/Room"
import type { GameState } from "src/entities/GameState"
import type { SessionObject } from "src/services/session.service";
import { Inject, UseInterceptors, ClassSerializerInterceptor } from "@nestjs/common";
import { Repository, In, DeepPartial } from "typeorm"
import { ProtectedGateway } from "src/gateways/protected.gateway";
import { PURGE_INTERVAL } from "../vars";
import { Action, Status, Subject } from "src/enums";
import { WsException, SubscribeMessage, ConnectedSocket } from "@nestjs/websockets";
import { instanceToPlain } from "class-transformer"

export interface UpdatePacket {
	subject: Subject;
	action: Action;
	id: number;
	value?: any;
}

export interface RedirectPacket {
	url: string;
	message: string;
	can_cancel: boolean;
}

export function create_packet(subject: Subject, action: Action, id: number, value?: any): UpdatePacket {
	return {
		subject,
		action,
		id,
		value,
	};
}

declare module "http" {
	export interface IncomingMessage {
		session: SessionObject;
	}
}

@UseInterceptors(ClassSerializerInterceptor)
export class UpdateGateway extends ProtectedGateway("update") {
	private readonly sockets = new Map<number, Socket[]>();
	private readonly status = new Map<number, Status>();

	static instance: UpdateGateway;

	constructor(
		@Inject("USER_REPO") private readonly user_repo: Repository<User>,
		@Inject("GAMESTATE_REPO") private readonly stateRepo: Repository<GameState>,
	) {
		super(user_repo);
		UpdateGateway.instance = this;
		setInterval(this.tick.bind(this), PURGE_INTERVAL);
	}

	async onConnect(client: Socket) {
		const user = await this.user_repo.findOneBy({ id: client.user });
		const now = new Date;
		const id = user.id;

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
		const user = await this.user_repo.findOneBy({ id: client.user });
		const sockets = this.sockets.get(user.id);

		if (!sockets) {
			return ;
		}
		
		const index = sockets.findIndex((socket) => socket.request.session.id === client.request.session.id);

		if (index < 0) {
			throw new WsException("could not find socket");
		}

		sockets.splice(index, 1);

		if (!sockets.length) {
			user.has_session = false;
			await this.user_repo.save(user);
		
			this.update(user);
			this.status.delete(user.id);
		}
	}

	remove_users(...users: User[]) {
		users.forEach((user) => {
			this.sockets.get(user.id)?.forEach((socket) => {
				socket.disconnect();
			});
		
			this.sockets.delete(user.id);
			this.status.delete(user.id);
		});
	}

	send_update(packet: UpdatePacket, ...receivers: Partial<User>[]) {
		if (!receivers.length) {
			this.server.emit("update", packet);
		}

		receivers.forEach((receiver) => {
			this.sockets.get(receiver.id)?.forEach((socket) => {
				socket.emit("update", packet);
			});
		});
	}

	async tick() {
		const ids = Array.from(this.status.keys())
		const users = await this.user_repo.find({ where: { id: In(ids) }});

		users.forEach((user) => this.update(user));
	}

	update(user: User) {
		const last_status = this.status.get(user.id) ?? Status.OFFLINE;

		// console.log(user.username, Status[this.status.get(user.id)], Status[user.status]);
		if (user.status !== last_status) {
			this.status.set(user.id, user.status);
		
			this.send_update({ 
				subject: Subject.USER,
				action: Action.UPDATE,
				id: user.id,
				value: { status: user.status }
			});
		}
	}

	async heartbeat(user: User) {
		if (user.is_bot)
			return;
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
		const user = await this.user_repo.findOne({ where: { id }});

		await this.heartbeat(user);
	}

	async send_state_update(user: Partial<User>, room: Partial<Room>, value?: DeepPartial<GameState>) {
		const friends = await this.userRepo.findBy({ friends: { id: user.id } });
		const state = await this.stateRepo.findOne({
			where: { room: { id: room.id } },
			relations: {
				teams: {
					players: {
						user: true,
					}
				}
			}
		});

		this.send_update({
			subject: Subject.GAMESTATE,
			action: Action.UPDATE,
			id: state.id,
			value: value ?? { teams: instanceToPlain(state.teams) },
		}, ...[user, ...friends]);
	}

}
