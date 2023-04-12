import type { PageLoad } from "./$types"
import { ChatRoom, User } from "$lib/entities";
import { updateStore } from "$lib/stores";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const joined: ChatRoom[] = await unwrap(get(`/chat`, { filter: "joined" }));
	const joinable: ChatRoom[] = await unwrap(get(`/chat`, { filter: "joinable" }));
	const rooms = joined.concat(joinable);

	updateStore(ChatRoom, rooms);
	updateStore(User, rooms
		.filter(({ owner }) => owner !== undefined)
		.map(({ owner }) => owner!));

	return { rooms };
}) satisfies PageLoad;
