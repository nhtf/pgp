import type { Entity, User, Member, Invite, Room, GameState } from "$lib/entities"
import type { UpdatePacket } from "$lib/types";
import { Subject, Action } from "$lib/enums";
import { updateManager } from "$lib/updateSocket";
import { writable, type Writable } from "svelte/store";
import { Access } from "$lib/enums"

type ObjectLiteral = { [key: string]: any; }

function updateDeepPartial(entity: ObjectLiteral, update: ObjectLiteral) {
	Object.keys(update).forEach((key) => {
		if (typeof update[key] === "object"	
			&& !Array.isArray(update[key]) 
			&& entity[key] !== undefined
			&& update[key] !== null 
		) {
			updateDeepPartial(entity[key], update[key]);
		} else {
			entity[key] = update[key];
		}
	});	
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
						break ;
					}

					updateDeepPartial(entities.get(update.id) as ObjectLiteral, update.value);
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

export function updateStore<T extends Entity>(store: Writable<Map<number, T>>, entities: T[] | T) {
	if (!Array.isArray(entities)) {
		entities = [entities];
	}

	store.update((stored) => {
		(entities as T[]).forEach((entity) => {
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
		updateStore(userStore, update.value);
	}
});

// Add state from new room
updateManager.set(Subject.ROOM, (update: UpdatePacket) => {
	if (update.action === Action.INSERT && update.value.type === "GameRoom") {
		updateStore(gameStateStore, update.value.state);
	}
});

// Score update
updateManager.set(Subject.TEAM, (update: UpdatePacket) => {
	if (update.action === Action.UPDATE) {
		gameStateStore.update((old) => {
			const state = old.get(update.value.stateId);
		
			if (state) {
				const team = state.teams.find(({ id }) => id === update.id)!;
	
				team.score = update.value.score;
			}
		
			return old;
		})
	}
});