import type { PageLoad } from "./$types"
import type { GameRoom } from "$lib/entities";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const ssr = false;

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const joined: GameRoom[] = await unwrap(get(`/game`, { filter: "joined" }));
	const joinable: GameRoom[] = await unwrap(get(`/game`, { filter: "joinable" }));
	const rooms = joined.concat(joinable);

	return { rooms };
}) satisfies PageLoad;
