import { Status } from "src/enums/Status";
import { IDLE_TIME, OFFLINE_TIME } from "../vars";

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

