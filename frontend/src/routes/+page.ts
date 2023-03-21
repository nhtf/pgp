import type { PageLoad } from "./$types";
import type { GameState } from "$lib/entities"
import { updateStore, gameStateStore } from "$lib/stores"
import { get } from "$lib/Web"

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	let games: GameState[] | null = null;

	try {
		games = await get(`/game/history`) as GameState[];

		updateStore(gameStateStore, games);
	} catch (error) {}

	return { games };
}) satisfies PageLoad;