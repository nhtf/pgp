import { BACKEND_ADDRESS } from "$lib/constants";
import type { UpdatePacket } from "$lib/types";
import { Subject, Action, Status } from "$lib/enums";
import { io } from "socket.io-client";

const WS = `ws://${BACKEND_ADDRESS}/update`;

class UpdateManager {
	socket = io(WS, { withCredentials: true });
	functions: Map<Subject, Function[]> = new Map();

	constructor() {
		this.socket.on("update", this.execute.bind(this));
	}

	set(subject: Subject, fun: Function) {
		const funs = this.functions.get(subject) || [];
	
		this.functions.set(subject, [...funs, fun]);

		return funs.length;
	}

	remove(subject: Subject, index: number) {
		const funs = this.functions.get(subject) || [];
	
		if (!funs.splice(index)) {
			console.log(`Attempt to delete nonexistant ${Subject[subject]};`);
		}
	
		this.functions.set(subject, funs);
	}

	async execute(update: UpdatePacket) {
		const funs = this.functions.get(update.subject);
		const style = `color: ${funs ? "black" : "gray"}`;

		if (update.subject === Subject.USER) {
			console.log(`%c${Subject[update.subject]}; ${Action[update.action]}; ${update.value.username}; ${Status[update.value.status]}`, style);
		} else {
			console.log(`%c${Subject[update.subject]}; ${Action[update.action]}; ID: ${update.id};`, style, update.value);
		}
	
		funs?.forEach((fun) => {
			fun(update);
		})
	}
}

export const updateManager = new UpdateManager;
