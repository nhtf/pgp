import type { PageLoad } from "./$types"
import type { ChatRoom, User } from "$lib/entities";
import { userStore, roomStore, updateStore } from "$lib/stores";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const joined: ChatRoom[] = await unwrap(get(`/chat?filter=joined`));
	const joinable: ChatRoom[] = await unwrap(get(`/chat?filter=joinable`));
	const rooms = joined.map((room) => {
		room.joined = true;
		return room;
	}).concat(joinable.map((room) => {
		room.joined = false;
		return room;
	}));

	const owners = rooms
		.filter(({ owner }) => owner !== undefined)
		.map(({ owner }) => owner) as User[];
	
	updateStore(userStore, owners);
	updateStore(roomStore, rooms);

	return { rooms };
}) satisfies PageLoad;
