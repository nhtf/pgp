import type { Entity, User, Member, Invite } from "$lib/entities"
import type { UpdatePacket } from "$lib/types";
import { Subject, Action } from "$lib/enums";
import { updateManager } from "$lib/updateSocket";
import { writable, type Writable } from "svelte/store";

function setUpdate<T>(store: Writable<Map<number, T>>, subject: Subject) {
	updateManager.set(subject, (update: UpdatePacket) => {
		store.update((entities) => {
			switch (update.action) {
				case Action.ADD:
				case Action.SET:
					entities.set(update.id, update.value);
					break;
				case Action.REMOVE:
					entities.delete(update.id);
					break;
			}

			return entities;
		});
	});
}

export function updateStore<T extends Entity>(store: Writable<Map<number, T>>, entities: T[]) {
	store.update((old) => {
		entities.forEach((entity) => {
			old.set(entity.id, entity)
		})

		return old;
	})
}

export const userStore = writable(new Map<number, User>);
export const memberStore = writable(new Map<number, Member>);
export const inviteStore = writable(new Map<number, Invite>);

setUpdate(userStore, Subject.USER);
setUpdate(memberStore, Subject.MEMBER);
setUpdate(inviteStore, Subject.INVITE);
