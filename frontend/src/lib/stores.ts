import type { Entity, User, Member, Invite, Room } from "$lib/entities"
import type { UpdatePacket } from "$lib/types";
import { Subject, Action } from "$lib/enums";
import { updateManager } from "$lib/updateSocket";
import { writable, type Writable } from "svelte/store";
import { Access } from "$lib/enums"

function setUpdate<T>(store: Writable<Map<number, T>>, subject: Subject) {
	updateManager.set(subject, (update: UpdatePacket) => {
		store.update((entities) => {
			switch (update.action) {
				case Action.ADD:
					entities.set(update.id, update.value);
					break;
				case Action.SET:
					if (!entities.has(update.id)) {
						entities.set(update.id, update.value);
						break;
					}

					const entity = entities.get(update.id) as { [key: string]: any };
				
					Object.entries(update.value).forEach(([key, value]) => {
						entity[key] = value;
					});
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
	store.update((stored) => {
		entities.forEach((entity) => {
			stored.set(entity.id, entity)
		});

		return stored;
	});
}

export const userStore = writable(new Map<number, User>);
export const roomStore = writable(new Map<number, Room>);
export const memberStore = writable(new Map<number, Member>);
export const inviteStore = writable(new Map<number, Invite>);
export const friendStore = writable(new Map<number, Entity>);

setUpdate(userStore, Subject.USER);
setUpdate(roomStore, Subject.ROOM);
setUpdate(inviteStore, Subject.INVITE);
setUpdate(memberStore, Subject.MEMBER);
setUpdate(friendStore, Subject.FRIEND);

// Removed from private room
updateManager.set(Subject.ROOM, (update: UpdatePacket) => {
	const room = update.value;

	if (update.action === Action.SET && room.access === Access.PRIVATE && room.joined === false) {
		roomStore.update((rooms) => {
			rooms.delete(update.id);

			return rooms;
		});
	}
});

// Add new friend to users
updateManager.set(Subject.FRIEND, (update: UpdatePacket) => {
	if (update.action === Action.ADD) {
		updateStore(userStore, [update.value]);
	}
});
