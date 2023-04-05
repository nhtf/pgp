import type { PageLoad } from "./$types"
import { Entity, User, GameState } from "$lib/entities"
import { get } from '$lib/Web';
import { unwrap } from '$lib/Alert';
import { updateStore, userStore, gameStore, friendStore } from "$lib/stores"

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const profile: User = await unwrap(get(`/user/${encodeURIComponent(params.username)}`, { achievements: true }));
	const friends: User[] = await unwrap(get(`/user/me/friends`));
	// const games: GameState[] = await unwrap(get(`/game/history/${profile.id}`));
	const games: GameState[] = [];

	updateStore(userStore, [profile, ...friends], User);
	updateStore(gameStore, games, GameState);
	updateStore(friendStore, friends, Entity);

	return { profile, games };
}) satisfies PageLoad;
