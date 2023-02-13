import { BACKEND_ADDRESS } from "$lib/constants";
import { Action, Status, Subject, type UpdatePacket } from "$lib/types";
import { io } from "socket.io-client";
import { unwrap } from "./Alert";
import { get } from "./Web";

const WS = `ws://${BACKEND_ADDRESS}/update`;

class UpdateManager {
	socket = io(WS, { withCredentials: true });
	functions: Map<Subject, Function> = new Map();

	constructor() {
		this.socket.on("update", this.execute.bind(this));
	}

	set(subject: Subject, fun: Function) {
		if (this.functions.has(subject)) {
			console.log(`Overwriting existing ${Subject[subject]}; `);
		}
	
		this.functions.set(subject, fun);
	}

	remove(subject: Subject) {
		if (!this.functions.has(subject)) {
			console.log(`Attempt to delete nonexistant ${Subject[subject]}; `);
		}
	
		this.functions.delete(subject);
	}

	async execute(update: UpdatePacket) {
		const fun = this.functions.get(update.subject);
		const style = `color: ${fun ? "black" : "gray"}`;

		if (update.subject === Subject.STATUS) {
			const user = await unwrap(get(`/user/id/${update.identifier}`));

			console.log(`%c${Subject[update.subject]}; ${Action[update.action]}; USER: ${user.username}; ${Status[update.value]}`, style);
		} else {
			console.log(`%c${Subject[update.subject]}; ${Action[update.action]}; ID: ${update.identifier};`, style, update.value);
		}
	
		if (fun) {
			fun(update);
		}
	}
}

export const updateManager = new UpdateManager;
