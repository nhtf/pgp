import type { PageLoad } from "./$types"
import type { DMRoom, User } from "$lib/entities";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const rooms: DMRoom[] = await unwrap(get(`/dm`));
	const others = rooms.map((room) => room.other) as User[];

	return { rooms, others };
}) satisfies PageLoad;
