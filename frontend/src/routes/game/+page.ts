import type { GameRoom, User } from "$lib/entities";
import type { PageLoad } from "./$types"
import { userStore, roomStore, updateStore, gameStateStore } from "$lib/stores";
import { get } from "$lib/Web";
import { unwrap } from "$lib/Alert";

export const ssr = false;

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const joined: GameRoom[] = await unwrap(get(`/game/joined`));
	const joinable: GameRoom[] = await unwrap(get(`/game/joinable`));
	const rooms = joined.concat(joinable);

	const gameStates = rooms.map((room) => room.state);

    updateStore(roomStore, rooms);
	updateStore(userStore, (rooms.filter(({ owner }) => owner).map(({ owner }) => owner)) as User[]);
	updateStore(gameStateStore, gameStates);
	
	return { rooms };
}) satisfies PageLoad;
