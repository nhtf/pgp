import { Injectable, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { Status } from "../enums/Status";
import { IDLE_TIME, OFFLINE_TIME, PURGE_INTERVAL } from "../vars";
import { User } from "../entities/User";
import { UpdateGateway } from "../gateways/update.gateway";

export function get_status(last_activity: number, now?: number): Status {
	if (!last_activity)
		return Status.OFFLINE;
	now = now || Date.now();
	const last = now - last_activity;
	if (last >= OFFLINE_TIME)
		return Status.OFFLINE;
	else if (last >= IDLE_TIME)
		return Status.IDLE;
	else
		return Status.ACTIVE;
}

@Injectable()
export class ActivityService {
	private readonly activity_map
	= new Map<number, { last_status: Status, last_activity: number}>();


	constructor(
		@Inject("USER_REPO") private readonly user_repo: Repository<User>,
	) {
		setInterval(async () => {
			await this.tick();
		}, PURGE_INTERVAL);
	}

	async tick() {
		const now = Date.now();
		for (const id of this.activity_map.keys()) {
			const { last_status, last_activity } = this.activity_map.get(id);
			const new_status = get_status(last_activity, now);
			if (new_status !== last_status) {
				await this.send_update(id);
				if (new_status == Status.OFFLINE)
					this.expire(id);
			}
		}
	}

	async expire(user: User | number) {
		const id = typeof user === "number" ? user : user.id;
		this.activity_map.delete(id);
	}

	async send_update(...users: User[] | number[]) {
		for (const user of users) {
			const id = typeof user === "number" ? user : user.id;
			await UpdateGateway.update_user_partial(id, { status: this.get_status(id) });
		}
	}

	async heartbeat(user: User | number) {
		if (typeof user === "number")
			user = await this.user_repo.findOneBy({ id: user });
		user.last_activity = new Date();
		const last_status = this.activity_map.get(user.id)?.last_status;
		if (last_status !== Status.ACTIVE)
			await this.send_update(user);
		this.activity_map.set(user.id, { last_status: Status.ACTIVE, last_activity: user.last_activity.getTime()});
		await this.user_repo.save(user);
	}

	get_status(user: User | number) {
		const id = typeof user === "number" ? user : user.id;
		return get_status(this.activity_map.get(id)?.last_activity);
	}
}
