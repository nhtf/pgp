import type { PageLoad } from "./$types"
import type { User, GameState } from "$lib/entities"
import { get } from '$lib/Web';
import { unwrap } from '$lib/Alert';
import { updateStore, userStore, gameStateStore, friendStore } from "$lib/stores"

export const ssr = false;

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const profile: User = await unwrap(get(`/user/${encodeURIComponent(params.username)}`));
	const friends: User[] = await unwrap(get(`/user/me/friends`));
	const games: GameState[] = await unwrap(get(`/game/history/${profile.id}`));
	const gameStates: GameState[] = await Promise.all(friends
		.filter((user) => user.activeRoomId)
		.map((user) => get(`/game/id/${user.activeRoomId}/state`)));

	updateStore(userStore, [profile, ...friends]);
	updateStore(gameStateStore, [...games, ...gameStates]);
	updateStore(gameStateStore, gameStates);
	updateStore(friendStore, friends.map(({ id }) => { return { id } }));

	return { profile, games };
}) satisfies PageLoad;
