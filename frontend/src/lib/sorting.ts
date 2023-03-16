import type { Entity, Room, User, Message } from "$lib/entities"

export function byId<T extends Entity>(first: T, second: T): number {
	return first.id - second.id;
}

export function byStatusThenName(first: User, second: User): number {
	let cmp = second.status - first.status;

	if (!cmp) {
		cmp = first.username.localeCompare(second.username);
	}

	return cmp;
}

export function byDate(first: Message, second: Message): number {
	return first.created - second.created;
}

export function byJoined(first: Room, second: Room): number {
	return first.joined ? (second.joined ? 0 : -1) : 1;
}
