import type { ChatRoom } from "$lib/types";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: ChatRoom = await unwrap(get(`/room/id/${params.room}`));
	const mine: ChatRoom[] = await get("/room/all");
	const joinable: ChatRoom[] = [];

    return { fetch, room, mine, joinable };
}) satisfies PageLoad;

