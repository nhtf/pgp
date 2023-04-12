import type { PageLoad } from "./$types";
import { Game } from "$lib/entities"
import { updateStore, gameStore } from "$lib/stores"
import { get } from "$lib/Web"

export const load: PageLoad = (async ({ fetch, parent }) => {
	window.fetch = fetch;

	const { user } = await parent();

	let games: Game[] = [];

	try {
		games = await get(`/game/history/${user?.id}`) as Game[];

		updateStore(Game, games);
	} catch (error) {}

	return { games };
}) satisfies PageLoad;