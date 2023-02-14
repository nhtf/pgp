import { Action, Subject, type UpdatePacket, type User } from "$lib/types";
import { updateManager } from "$lib/updateSocket";
import { writable } from "svelte/store";

export const userStore = writable(new Map<number, User>);

updateManager.set(Subject.USER, (update: UpdatePacket) => {
	userStore.update((users) => {
		switch (update.action) {
			case Action.ADD | Action.SET:
				console.log("update: ", update.value);
				users.set(update.identifier as number, update.value);
				break ;
			case Action.REMOVE:
				users.delete(update.identifier as number);
				break;
		}

		return users;
	});
})
