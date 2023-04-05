import type { PageLoad } from "./$types"
import { GameRoom, GameState, User } from "$lib/entities";
import { userStore, roomStore, updateStore, gameStore } from "$lib/stores";
import { get } from "$lib/Web";
import { unwrap } from "$lib/Alert";

export const ssr = false;

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const joined: GameRoom[] = await unwrap(get(`/game?filter=joined`));
	const joinable: GameRoom[] = await unwrap(get(`/game?filter=joinable`));
	const rooms = joined.concat(joinable);

    updateStore(roomStore, rooms, GameRoom);
	updateStore(gameStore, rooms.map(({ state }) => state!), GameState);
	
	return { rooms };
}) satisfies PageLoad;
