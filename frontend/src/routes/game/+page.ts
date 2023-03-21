import type { GameRoom } from "$lib/entities";
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
	const teams = gameStates.map((gameState) => gameState.teams).flat();

    updateStore(roomStore, rooms);
	updateStore(userStore, rooms.map((room) => room.owner!));
	updateStore(gameStateStore, gameStates);
	
	return { rooms };
}) satisfies PageLoad;
