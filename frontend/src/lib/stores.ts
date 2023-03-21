import type { Entity, User, Member, Invite, Room, GameState, GameRoom } from "$lib/entities"
import type { UpdatePacket } from "$lib/types";
import { Subject, Action } from "$lib/enums";
import { updateManager } from "$lib/updateSocket";
import { writable, type Writable } from "svelte/store";
import { Access } from "$lib/enums"

// From typeorm
type ObjectLiteral = { [key: string]: any; }
type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]>; } : T;

function updateDeepPartial(entity: ObjectLiteral, update: ObjectLiteral) {
	// console.group("enter", entity);
	Object.keys(update).forEach((key) => {
		if (!entity[key]) {
			entity[key] = {};
		}
		if (typeof update[key] === "object" && update[key]) {
			updateDeepPartial(entity[key], update[key])
		} else {

			console.log(`${key}: ${typeof update[key]} = ${update[key]}`);

			const copy = entity[key];
		
			entity[key] = update[key];
			Object.keys(copy).forEach((key) => {
				// console.log(key);
				if (copy[key] && !entity[key]) {
					entity[key] = copy[key];
				}
			})
		}
	});
	// console.groupEnd();
}

function setUpdate<T extends Entity>(store: Writable<Map<number, T>>, subject: Subject) {
	updateManager.set(subject, (update: UpdatePacket) => {
		store.update((entities) => {
			switch (update.action) {
				case Action.INSERT:
					entities.set(update.id, update.value);
					break;
				case Action.UPDATE:
					if (!entities.has(update.id)) {
						entities.set(update.id, update.value);
						break;
					}

					const entity = entities.get(update.id) as ObjectLiteral;

					updateDeepPartial(entity, update.value);

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
export const blockStore = storeFactory<Entity>(Subject.BLOCK);
export const memberStore = storeFactory<Member>(Subject.MEMBER);
export const inviteStore = storeFactory<Invite>(Subject.INVITE);
export const friendStore = storeFactory<Entity>(Subject.FRIEND);
export const gameStateStore = storeFactory<GameState>(Subject.GAMESTATE);

// Removed from private room
updateManager.set(Subject.ROOM, (update: UpdatePacket) => {
	if (update.action === Action.UPDATE && update.value.joined === false) {
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
	if (update.action === Action.INSERT) {
		updateStore(userStore, [update.value]);
	}
});

// Add state from new room
updateManager.set(Subject.ROOM, (update: UpdatePacket) => {
	if (update.action === Action.INSERT && update.value.type === "GameRoom") {
		updateStore(gameStateStore, [update.value.state]);
	}
});
