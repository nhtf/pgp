import type { PageLoad } from "./$types"
import { GameRoom, Game } from "$lib/entities";
import { updateStore } from "$lib/stores";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const ssr = false;

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const joined: GameRoom[] = await unwrap(get(`/game`, { filter: "joined" }));
	const joinable: GameRoom[] = await unwrap(get(`/game`, { filter: "joinable" }));
	const rooms = joined.concat(joinable);

    updateStore(GameRoom, rooms);
	updateStore(Game, rooms.map(({ state }) => state!));
	
	return { rooms };
}) satisfies PageLoad;
