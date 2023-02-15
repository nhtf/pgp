import { Action, Subject, type UpdatePacket, type User } from "$lib/types";
import { updateManager } from "$lib/updateSocket";
import { writable } from "svelte/store";

export const userStore = writable(new Map<number, User>);

updateManager.set(Subject.USER, (update: UpdatePacket) => {
	userStore.update((users) => {
		switch (update.action) {
			case Action.ADD:
			case Action.SET:
				users.set(update.identifier, update.value);
				break ;
			case Action.REMOVE:
				users.delete(update.identifier );
				break;
			}
			
		return users;
	});
})
