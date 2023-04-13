import type { PageLoad } from "./$types"
import { updateStore, friendStore } from "$lib/stores"
import { Entity, User, Stat, Game } from "$lib/entities"
import { unwrap } from '$lib/Alert';
import { get } from '$lib/Web';

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const profile: User = await unwrap(get(`/user/${encodeURIComponent(params.username)}`, { achievements: true }));
	const friends: User[] = await unwrap(get(`/user/me/friends`));
	const stats: Stat[] = await unwrap(get(`/stat`, { username: profile.username }));
	const { level }: { level: number } = await unwrap(get(`/stat/levels/${encodeURIComponent(profile.username)}`));
	const games: Game[] = await get(`/stat/history/${profile.id}`)

	updateStore(User, [profile, ...friends]);
	updateStore(Entity, friends, friendStore);
	updateStore(Game, games);

	return { profile, stats, level, games };
}) satisfies PageLoad;
