import type { PageLoad } from "./$types"
import { Entity, User, GameState } from "$lib/entities"
import { get } from '$lib/Web';
import { unwrap } from '$lib/Alert';
import { updateStore, userStore, gameStateStore, friendStore } from "$lib/stores"

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const profile: User = await unwrap(get(`/user/${encodeURIComponent(params.username)}`));
	const friends: User[] = await unwrap(get(`/user/me/friends`));
	// const games: GameState[] = await unwrap(get(`/game/history/${profile.id}`));

	updateStore(userStore, [profile, ...friends], User);
	// updateStore(gameStateStore, games, GameState);
	updateStore(friendStore, friends.map(({ id }) => { return { id } }), Entity);

	// return { profile, games };
	return { profile };
}) satisfies PageLoad;
