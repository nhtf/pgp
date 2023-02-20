import type { UpdatePacket, User, Invite } from "$lib/types";
import { Subject, Action } from "$lib/enums";
import { updateManager } from "$lib/updateSocket";
import { writable } from "svelte/store";

export const userStore = writable(new Map<number, User>);
export const inviteStore = writable(new Map<number, Invite>);

updateManager.set(Subject.USER, (update: UpdatePacket) => {
	userStore.update((users) => {
		switch (update.action) {
			case Action.ADD:
			case Action.SET:
				users.set(update.id, update.value);
				break ;
			case Action.REMOVE:
				users.delete(update.id );
				break;
		}
			
		return users;
	});
});

updateManager.set(Subject.INVITE, (update: UpdatePacket) => {
	inviteStore.update((invites) => {
		switch (update.action) {
			case Action.ADD:
			case Action.SET:
				invites.set(update.id, update.value);
				break ;
			case Action.REMOVE:
				invites.delete(update.id );
				break;
		}
			
		return invites;
	});
});
