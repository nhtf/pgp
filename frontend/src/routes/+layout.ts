import { get } from "$lib/Web";
import type { User, Invite } from "$lib/types";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	type Ret = {fetch: any; user: User| null; invites: Invite[], friend_requests: any[]}
	const ret: Ret = { fetch, invites: [], friend_requests: [], user: null };

	try {
		const user: User | null = await get("/user/me");
		const invites: Invite[] = await get("/user/me/invites");
		const friend_requests: any[] = await get("/user/me/friends/requests");
		ret.user = user;
		ret.invites = invites.filter((value) => {
			value.from && value.from.username !== user?.username
		});
		ret.friend_requests = friend_requests.filter((value) => 
			value.from.username !== user?.username
		);
	} catch (err) {
		console.log("error in layout.ts: ", err);
	}

	return ret;
}) satisfies LayoutLoad;
