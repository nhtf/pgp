import type { PageLoad } from "./$types";
import type { GameState } from "$lib/entities"
import { unwrap } from "$lib/Alert"
import { get } from "$lib/Web"

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const games: GameState[] = await get(`/game/history`);

	return { games };
}) satisfies PageLoad;