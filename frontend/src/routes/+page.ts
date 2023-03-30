import type { PageLoad } from "./$types";
import type { GameState } from "$lib/entities"
import { updateStore, gameStateStore } from "$lib/stores"
import { get } from "$lib/Web"

export const load: PageLoad = (async ({ fetch, parent }) => {
	window.fetch = fetch;

	const { user } = await parent();

	let games: GameState[] = [];

	try {
		games = await get(`/game/history/${user?.id}`) as GameState[];

		updateStore(gameStateStore, games);
	} catch (error) {}

	return { games };
}) satisfies PageLoad;