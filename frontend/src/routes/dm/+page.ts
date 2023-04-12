import type { PageLoad } from "./$types"
import { updateStore, roomStore, userStore } from "$lib/stores"
import { DMRoom, User } from "$lib/entities";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const rooms: DMRoom[] = await unwrap(get(`/dm`));
	const others = rooms.map((room) => room.other) as User[];

	updateStore(User, others);
	updateStore(DMRoom, rooms);

	return { rooms, others };
}) satisfies PageLoad;
