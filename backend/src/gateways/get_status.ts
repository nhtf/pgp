import { Status } from "src/enums/Status";
import { IDLE_TIME, OFFLINE_TIME } from "../vars";

export function get_status(last_activity: Date): Status {
	const last = Date.now() - last_activity.getTime();

	return last >= OFFLINE_TIME	?
		Status.OFFLINE : last >= IDLE_TIME ?
			Status.IDLE : Status.ACTIVE;
}

