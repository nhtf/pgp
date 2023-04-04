import type { PageLoad } from "./$types"
import { ChatRoom, User } from "$lib/entities";
import { userStore, roomStore, updateStore } from "$lib/stores";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const joined: ChatRoom[] = await unwrap(get(`/chat?filter=joined`));
	const joinable: ChatRoom[] = await unwrap(get(`/chat?filter=joinable`));
	const rooms = joined.concat(joinable);

	updateStore(roomStore, rooms, ChatRoom);
	updateStore(userStore, rooms
		.filter(({ owner }) => owner !== undefined)
		.map(({ owner }) => owner!),
	User);

	return { rooms };
}) satisfies PageLoad;
