import type { PageLoad } from "./$types"
import type { ChatRoom } from "$lib/entities";
import { userStore, roomStore, updateStore } from "$lib/stores";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const joined: ChatRoom[] = await unwrap(get(`/chat/joined`));
	const joinable: ChatRoom[] = await unwrap(get(`/chat/joinable`));
	const rooms = joined.concat(joinable);

	updateStore(userStore, rooms.map((room) => room.owner));
	updateStore(roomStore, rooms);

	return { rooms };
}) satisfies PageLoad;
