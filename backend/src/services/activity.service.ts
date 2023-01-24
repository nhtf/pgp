import { Injectable } from "@nestjs/common";
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

	static instance: ActivityService = null;

	constructor() {
		if (ActivityService.instance)
			throw new Error("singleton ActivityService instanciated multiple times");
		ActivityService.instance = this;
		setInterval(async () => {
			await this.tick();
		}, PURGE_INTERVAL);
	}

	async tick() {
		const now = Date.now();
		for (const id of this.activity_map.keys()) {
			const { last_status, last_activity } = this.activity_map.get(id);
			const new_status = get_status(last_activity, now);
			if (new_status !== last_status)
				await this.send_update(id );
		}
	}

	async send_update(...users: User[] | number[]) {
		for (const user of users) {
			const id = typeof user === "number" ? user : user.id;
			await UpdateGateway.update_user_partial(id, { status: this.get_status(id) });
		}
	}

	get_status(user: User | number) {
		const id = typeof user === "number" ? user : user.id;
		return get_status(this.activity_map.get(id)?.last_activity);
	}
}
