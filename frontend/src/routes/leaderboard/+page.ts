import type { PageLoad } from "./$types";
import { type Stat, User } from "$lib/entities";
import { updateStore } from "$lib/stores";
import { dedup } from "$lib/util";
import { get } from "$lib/Web";

export const ssr = false;

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const leaderBoard: Stat[] = await get('/stat', { sort: "DESC" });

	const users = await Promise.all(
	   dedup(leaderBoard)
	  .map(({ id }) => get(`/user/id/${id}`) as Promise<User>)
	);

	updateStore(User, users);

	return { stats: leaderBoard };
}) satisfies PageLoad;