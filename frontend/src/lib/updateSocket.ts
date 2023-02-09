import { BACKEND_ADDRESS } from "$lib/constants";
import { Action, Status, Subject, type UpdatePacket } from "$lib/types";
import { io } from "socket.io-client";

const WS = `ws://${BACKEND_ADDRESS}/update`;

class UpdateManager {
	socket = io(WS, { withCredentials: true });
	functions: Map<Subject, Function> = new Map();

	constructor() {
		this.socket.on("update", this.execute.bind(this));
	}

	add(subject: Subject, fun: Function) {
		if (this.functions.has(subject)) {
			console.log(`Overwriting ${Subject[subject]}; `);
		}
	
		this.functions.set(subject, fun);
	}

	execute(update: UpdatePacket) {
		if (update.subject === Subject.STATUS) {
			console.log(`${Subject[update.subject]}; ${Action[update.action]}; ID: ${update.identifier};`, Status[update.value]);
		} else {
			console.log(`${Subject[update.subject]}; ${Action[update.action]}; ID: ${update.identifier};`, update.value);
		}
	
		const fun = this.functions.get(update.subject);

		if (fun) {
			fun(update);
		}
	}
}

export const updateManager = new UpdateManager;
