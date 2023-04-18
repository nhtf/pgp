import type { UpdatePacket } from "$lib/types";
import { ChatRoom, RoomInvite, ChatRoomMember, Entity, FriendRequest, Game, GameRoom, GameRoomMember, Invite, Member, Room, User, DMRoom } from "$lib/entities";
import { Access, Action, Subject } from "$lib/enums";
import { updateManager } from "$lib/updateSocket";
import { writable, type Writable } from "svelte/store";

updateManager.set(Subject.ROOM, onRoomInsert);
updateManager.set(Subject.TEAM, onScoreUpdate);
updateManager.set(Subject.ROOM, onPrivateRemove);
updateManager.set(Subject.FRIEND, onFriendInsert);

export const userStore = storeFactory(User, Subject.USER);
export const roomStore = storeFactory(Room, Subject.ROOM);
export const gameStore = storeFactory(Game, Subject.GAMESTATE);
export const memberStore = storeFactory(Member, Subject.MEMBER);
export const inviteStore = storeFactory(Invite, Subject.INVITE);

export const blockStore = storeFactory(Entity, Subject.BLOCK);
export const friendStore = storeFactory(Entity, Subject.FRIEND);

const stores = new Map<(new () => any), Writable<Map<number, any>>>([
	[User, userStore],
	[Room, roomStore],
	[DMRoom, roomStore],
	[ChatRoom, roomStore],
	[GameRoom, roomStore],
	[Game, gameStore],
	[Member, memberStore],
	[ChatRoomMember, memberStore],
	[GameRoomMember, memberStore],
	[Invite, inviteStore],
]);

export function store<T extends Entity>(entityType: (new () => T)): Writable<Map<number, T>> {
	return stores.get(entityType)!;
}

export function updateStore<T extends Entity>(entityType: (new () => T), entities: T | T[], customStore?: Writable<Map<number, Entity>>) {
	if (!Array.isArray(entities)) {
		entities = [entities];
	}

	const stored = customStore ?? store(entityType);

	stored.update((stored) => {
		(entities as T[]).forEach((entity) => {
			if (!stored.has(entity.id)) {
				stored.set(entity.id, create(entity, entityType))
			} else {
				updateDeepPartial(stored.get(entity.id)!, entity);
			}
		});

		return stored;
	});
}

export type ObjectLiteral = { [key: string]: any; }

const generics = new Map<string, (new () => any)>([
	["ChatRoom", ChatRoom],
	["GameRoom", GameRoom],
	["ChatRoomInvite", RoomInvite],
	["GameRoomInvite", RoomInvite],
	["FriendRequest", FriendRequest],
	["ChatRoomMember", ChatRoomMember],
	["GameRoomMember", GameRoomMember],
]);

function create<T extends Entity>(value: ObjectLiteral, entityType: (new () => T)): T {
	let entity = new entityType;

	if (value?.type) {
		let type = generics.get(value.type);

		if (type)
			entity = new type;
	}

	updateDeepPartial(entity, value);

	return entity;
}

function updateDeepPartial(entity: ObjectLiteral, update: ObjectLiteral) {
	Object.keys(update).forEach((key) => {
		if (typeof update[key] === "object"
			&& update[key] !== null
			&& !Array.isArray(update[key])
			&& entity[key] !== undefined
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

function storeFactory<T extends Entity>(entityType: (new () => T), subject: Subject): Writable<Map<number, T>> {
	const store = writable(new Map<number, T>);

	setUpdate(store, subject, entityType);

	return store;
}

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
		updateStore(User, update.value);
	}
}

// Add state, owner and other from new room
async function onRoomInsert(update: UpdatePacket) {
	if (update.value?.state) {
		updateStore(User, update.value.state);
	}

	if (update.value?.owner) {
		updateStore(User, update.value.owner);
	}

	if (update.value?.other) {
		updateStore(User, update.value.other);
	}
};

// Change team score in game
async function onScoreUpdate(update: UpdatePacket) {
	if (update.action === Action.UPDATE) {
		store(Game)!.update((old) => {
			const state = old.get(update.value.stateId);

			if (state) {
				const team = state.teams?.find(({ id }) => id === update.id);

				if (team)
					team.score = update.value.score;
			}

			return old;
		});
	}
}
