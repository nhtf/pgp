import type { PageLoad } from "./$types"
import { updateStore, friendStore } from "$lib/stores"
import { Entity, User, Game, Stat } from "$lib/entities"
import { unwrap } from '$lib/Alert';
import { get } from '$lib/Web';

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const profile: User = await unwrap(get(`/user/${encodeURIComponent(params.username)}`, { achievements: true }));
	const friends: User[] = await unwrap(get(`/user/me/friends`));
	const stats: Stat[] = await unwrap(get(`/leaderboard`, { username: profile.username }));
	const level: number = await unwrap(get(`/leaderboard/levels/${encodeURIComponent(profile.username)}`));

	updateStore(User, [profile, ...friends]);
	updateStore(Entity, friends, friendStore);

	return { profile, stats, level };
}) satisfies PageLoad;
