import { WebSocketGateway } from "@nestjs/websockets";
import { User} from "../entities/User";
import { FRONTEND_ADDRESS, PURGE_INTERVAL, IDLE_TIME, OFFLINE_TIME } from "../vars";
import { Status } from "../enums/Status";
import { UpdateGateway } from "./update.gateway";

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

//TODO create activity service?
@WebSocketGateway({
	namespace: "activity",
	cors: { origin: FRONTEND_ADDRESS, credentials: true }
})
export class ActivityGateway {
	//TODO instead of storing last check, store last status
	private static readonly activity_map = new Map<number, { last_status: Status, last_activity: number}>();

	constructor() {
		setInterval(async () => {
			await this.tick();
		}, PURGE_INTERVAL);
	}

	async tick() {
		for (const id of ActivityGateway.activity_map.keys()) {
			await this.tick_user(id);
		}
	}

	async tick_user(user: User | number) {
		const id = typeof user === "number" ? user : user.id;
		const { last_status, last_activity } = ActivityGateway.activity_map.get(id);
		const now = Date.now();

		const status = get_status(last_activity, now);
		ActivityGateway.activity_map.set(id, { last_status: status, last_activity: last_activity });
		if (last_status !== status) {
			await ActivityGateway.send_update(id);
		}
	}

	static async user_heartbeat(user: User | number) {
		const id = typeof user === "number" ? user : user.id;

		const info = ActivityGateway.activity_map.get(id);
		const last_status = info?.last_status;
		const last_activity = info?.last_activity;

		const now = Date.now();
		ActivityGateway.activity_map.set(id, { last_status: Status.ACTIVE, last_activity: now });
		if (last_status !== Status.ACTIVE)
			ActivityGateway.send_update(id);
	}

	static last_activity(user: User | number): number | undefined {
		const id = typeof user === "number" ? user : user.id;
		return ActivityGateway.activity_map.get(id)?.last_activity;
	}
	
	static get_status(user: User | number): Status {
		const last = ActivityGateway.last_activity(user);
		return get_status(last);
	}

	static async send_update(...users: User[] | number[]) {
		for (const user of users) {
			const id = typeof user === "number" ? user : user.id;
			await UpdateGateway.update_user_partial(id, { status: ActivityGateway.get_status(id) });
		}
	}
}
