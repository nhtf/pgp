import type { UpdatePacket } from "$lib/types";
import type { Subject } from "$lib/enums";
import { BACKEND_WS } from "$lib/constants";
import { io } from "socket.io-client";

const WS = `${BACKEND_WS}/update`;

type UpdateFunction = (update: UpdatePacket) => Promise<void> | void;

class UpdateManager {
	functions: { fun: UpdateFunction, subject: Subject }[] = [];

	constructor() {
		updateSocket.on("update", this.execute.bind(this));
	}

	set(subject: Subject, fun: UpdateFunction) {
		return this.functions.push({ subject, fun }) - 1;
	}

	remove(...indices: number[]) {
		indices.forEach((index) => {
			this.functions.splice(index, 1);
		});
	}

	prioritise(...indices: number[]) {
		indices.forEach((index) => {
			this.functions.splice(0, 0, ...this.functions.splice(index, 1))
		});
	}

	execute(update: UpdatePacket) {
		const funs = this.functions
			.filter(({ subject }) => subject === update.subject)
			.map(({ fun }) => fun);

		// const style = `color: ${funs.length ? "black" : "gray"}`;

		// console.log(`%c${Subject[update.subject]}; ${Action[update.action]}; ID: ${update.id};`, style, update.value);

		// IIFE
		// socket.on() can't be awaited, but some functions need to run before others
		(async () => {
			for (const fun of funs) {
				await fun(update);
			}
		})();
	}
}

export const updateSocket = io(WS, { withCredentials: true });
export const updateManager = new UpdateManager;
