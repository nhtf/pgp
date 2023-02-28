import type { UpdatePacket } from "$lib/types";
import { Subject, Action, Status } from "$lib/enums";
import { BACKEND_ADDRESS } from "$lib/constants";
import { io } from "socket.io-client";

const WS = `ws://${BACKEND_ADDRESS}/update`;

type UpdateFunction = (update: UpdatePacket) => any;

class UpdateManager {
	socket = io(WS, { withCredentials: true });
	functions: { fun: UpdateFunction, subject: Subject }[] = [];

	constructor() {
		this.socket.on("update", this.execute.bind(this));
	}

	set(subject: Subject, fun: UpdateFunction) {
		return this.functions.push({ subject, fun }) - 1;
	}

	remove(indices: number | number[]) {
		if (typeof indices === "number") {
			indices = [indices];
		}

		indices.forEach((index) => {
			this.functions.splice(index);
		});
	}

	async execute(update: UpdatePacket) {
		const funs = this.functions.filter(({ subject }) => subject === update.subject);
		const style = `color: ${funs.length ? "black" : "gray"}`;

		if (update.subject === Subject.USER) {
			console.log(`%c${Subject[update.subject]}; ${Action[update.action]}; ${update.value.username}; ${Status[update.value.status]}`, style);
		} else {
			console.log(`%c${Subject[update.subject]}; ${Action[update.action]}; ID: ${update.id};`, style, update.value);
		}

		funs?.forEach(({ fun }) => {
			fun(update);
		})
	}
}

export const updateManager = new UpdateManager;
