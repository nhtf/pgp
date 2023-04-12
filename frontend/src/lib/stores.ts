import type { UpdatePacket } from "$lib/types";
import { Entity, User, Member, ChatRoom, GameRoom, Room, Invite, GameState } from "$lib/entities"
import { writable, type Writable } from "svelte/store";
import { updateManager } from "$lib/updateSocket";
import { Subject, Action } from "$lib/enums";
import { Access } from "$lib/enums"

export type ObjectLiteral = { [key: string]: any; }

function create<T extends Entity>(value: ObjectLiteral, entityType: (new () => T)): T {
	let entity = new entityType;

	// TODO...
	if (value.access !== undefined) {
		entity = (value.type === "ChatRoom" ? new ChatRoom : new GameRoom) as unknown as T;
	}

	updateDeepPartial(entity, value);

	return entity;
}

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

function setUpdate<T extends Entity>(store: Writable<Map<number, T>>, subject: Subject, entityType: (new () => T)) {
	updateManager.set(subject, async (update: UpdatePacket) => {
		store.update((entities) => {
			switch (update.action) {
				case Action.INSERT:
					entities.set(update.id, create(update.value, entityType));
					break;
				case Action.UPDATE:
					if (!entities.has(update.id)) {
						entities.set(update.id, create({ id: update.id }, entityType));
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

function storeFactory<T extends Entity>(subject: Subject, entityType: (new () => T)): Writable<Map<number, T>> {
	const store = writable(new Map<number, T>);

	setUpdate(store, subject, entityType);

	return store;
}

export function updateStore<T extends Entity>(store: Writable<Map<number, T>>, entities: T | T[], entityType: (new () => T)) {
	if (!Array.isArray(entities)) {
		entities = [entities];
	}

	store.update((stored) => {
		(entities as T[]).forEach((entity) => {
			stored.set(entity.id, create(entity, entityType))
		});

		return stored;
	});
}

export const userStore = storeFactory(Subject.USER, User);
export const roomStore = storeFactory(Subject.ROOM, Room);
export const blockStore = storeFactory<Entity>(Subject.BLOCK, Entity);
export const memberStore = storeFactory<Member>(Subject.MEMBER, Member);
export const inviteStore = storeFactory<Invite>(Subject.INVITE, Invite);
export const friendStore = storeFactory<Entity>(Subject.FRIEND, Entity);
export const gameStore = storeFactory<GameState>(Subject.GAMESTATE, GameState);

updateManager.set(Subject.ROOM, onRoomInsert);
updateManager.set(Subject.TEAM, onScoreUpdate);
updateManager.set(Subject.ROOM, onPrivateRemove);
updateManager.set(Subject.FRIEND, onFriendInsert);

// Removed from private room
async function onPrivateRemove(update: UpdatePacket) {
	if (update.action === Action.UPDATE && update.value.joined === false) {
		roomStore.update((rooms) => {
			const room = rooms.get(update.id)!;

			if (room.access === Access.PRIVATE) {
				rooms.delete(update.id);
			}

			return rooms;
		});
	}
}

// Add new friend to userStore
async function onFriendInsert(update: UpdatePacket) {
	if (update.action === Action.INSERT) {
		updateStore(userStore, update.value, User);
	}
}

// Add state and/or owner from new room
async function onRoomInsert(update: UpdatePacket) {
	if (update.value?.state) {
		updateStore(gameStore, update.value.state, GameState);
	}

	if (update.value?.owner) {
		updateStore(userStore, update.value.owner, User);
	}
};

// Change team score in game
async function onScoreUpdate(update: UpdatePacket) {
	if (update.action === Action.UPDATE) {
		gameStore.update((old) => {
			const state = old.get(update.value.stateId);
		
			if (state) {
				const team = state.teams.find(({ id }) => id === update.id)!;
	
				team.score = update.value.score;
			}
		
			return old;
		});
	}
}
