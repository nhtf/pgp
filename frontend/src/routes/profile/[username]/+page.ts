import type { PageLoad } from "./$types"
import { Entity, User, Stat, Game } from "$lib/entities"
import { updateStore, friendStore } from "$lib/stores"
import { unwrap } from '$lib/Alert';
import { get } from '$lib/Web';

export const load: PageLoad = (async ({ fetch, params, parent }) => {
	window.fetch = fetch;

	const { user } = await parent();
	const profile: User = await unwrap(get(`/user/${encodeURIComponent(params.username)}`, { achievements: true }));
	const stats: Stat[] = await unwrap(get(`/stat`, { username: profile.username }));
	const games: Game[] = await unwrap(get(`/stat/history`, { username: profile.username }));
	const { level }: { level: number } = await unwrap(get(`/stat/levels`, { username: profile.username }));

	updateStore(User, profile);
	updateStore(Game, games);

	if (profile.id === user?.id) {
		const friends: User[] = await unwrap(get(`/user/me/friends`));

		updateStore(User, friends);
		updateStore(Entity, friends, friendStore);
	}

	return { profile, stats, level, games };
}) satisfies PageLoad;
