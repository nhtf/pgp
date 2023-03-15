import type { Entity, User, Member, Invite, Room, GameState, Team } from "$lib/entities"
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

function storeFactory<T extends Entity>(subject: Subject): Writable<Map<number, T>> {
	const store = writable(new Map<number, T>);

	setUpdate(store, subject);

	return store;
}

export function updateStore<T extends Entity>(store: Writable<Map<number, T>>, entities: T[]) {
	store.update((stored) => {
		entities.forEach((entity) => {
			stored.set(entity.id, entity)
		});

		return stored;
	});
}

export const userStore = storeFactory<User>(Subject.USER);
export const roomStore = storeFactory<Room>(Subject.ROOM);
export const teamStore = storeFactory<Team>(Subject.TEAM);
export const memberStore = storeFactory<Member>(Subject.MEMBER);
export const inviteStore = storeFactory<Invite>(Subject.INVITE);
export const friendStore = storeFactory<Entity>(Subject.FRIEND);
export const gameStateStore = storeFactory<GameState>(Subject.GAMESTATE);
export const blockStore = storeFactory<Entity>(Subject.BLOCK);

// Removed from private room
updateManager.set(Subject.ROOM, (update: UpdatePacket) => {
	if (update.action === Action.SET && update.value.joined === false) {
		roomStore.update((rooms) => {
			const room = rooms.get(update.id)!;

			if (room.access === Access.PRIVATE) {
				rooms.delete(update.id);
			}

			return rooms;
		});
	}
});

// Add new friend to userStore
updateManager.set(Subject.FRIEND, (update: UpdatePacket) => {
	if (update.action === Action.ADD) {
		updateStore(userStore, [update.value]);
	}
});

// Add teams from new gamestate
updateManager.set(Subject.GAMESTATE, (update: UpdatePacket) => {
	if (update.action === Action.ADD) {
		updateStore(teamStore, update.value.teams);
	}
});
