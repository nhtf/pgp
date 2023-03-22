import type { PageLoad } from "./$types"
import type { User, GameState } from "$lib/entities"
import { get } from '$lib/Web';
import { unwrap } from '$lib/Alert';
import { updateStore, userStore, gameStateStore } from "$lib/stores"

export const ssr = false;

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const profile: User = await unwrap(get(`/user/${encodeURIComponent(params.username)}`));
	const games: GameState[] = await get(`/game/history/${profile.id}`);

	updateStore(userStore, [profile]);
	updateStore(gameStateStore, games);

	return { profile, games };
}) satisfies PageLoad;
