import type { PageLoad } from "./$types";
import type { Stat, User } from "$lib/entities";
import { dedup } from "$lib/util";
import { get } from "$lib/Web";

export const ssr = false;

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const ranked: Stat[] = await get('/stat', { sort: "DESC", ranked: true });
	const unranked: Stat[] = await get('/stat', { sort: "DESC", ranked: false });

	const users = await Promise.all(
	   dedup([...ranked, ...unranked])
	  .map(({ id }) => get(`/user/id/${id}`) as Promise<User>)
	);

	return { users, ranked, unranked };
}) satisfies PageLoad;
