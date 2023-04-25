import type { User, Stat, Game } from "$lib/entities"
import type { PageLoad } from "./$types"
import { unwrap } from '$lib/Alert';
import { get } from '$lib/Web';

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const profile: User = await unwrap(get(`/user/${encodeURIComponent(params.username)}`, { achievements: true }));
	const { level }: { level: number } = await unwrap(get(`/stat/levels`, { username: profile.username }));
	const games: Game[] = await unwrap(get(`/stat/history`, { username: profile.username }));
	const stats: Stat[] = await unwrap(get(`/stat`, { username: profile.username }));

	return { profile, level, games, stats, achievements: profile.achievements };
}) satisfies PageLoad;
