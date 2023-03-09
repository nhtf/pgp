import type { PageLoad } from "./$types";
import type { Player } from "$lib/entities"
import { unwrap } from "$lib/Alert"
import { get } from "$lib/Web"

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const players: Player[] = await unwrap(get(`/game/history`));

	return { players };
}) satisfies PageLoad;