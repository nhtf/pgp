import type { GameRoom, User } from "$lib/entities";
import type { PageLoad } from "./$types"
import { userStore, roomStore, updateStore, gameStateStore } from "$lib/stores";
import { get } from "$lib/Web";
import { unwrap } from "$lib/Alert";

export const ssr = false;

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const joined: GameRoom[] = await unwrap(get(`/game?filter=joined`));
	const joinable: GameRoom[] = await unwrap(get(`/game?filter=joinable`));
	const rooms = joined.concat(joinable);

    updateStore(roomStore, rooms);
	updateStore(userStore, (rooms.map(({ owner }) => owner)) as User[]);
	updateStore(gameStateStore, rooms.map(({ state }) => state!));
	
	return { rooms };
}) satisfies PageLoad;
