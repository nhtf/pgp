import { get } from "$lib/Web";
import type { User, Invite } from "$lib/types";
import type { LayoutLoad } from "./$types";
import { unwrap } from "$lib/Alert";

export const ssr = false;

//TODO handle the updates of the notifications/invites/requests

let user : User | null;

function isFromOther(element: Invite) {
    return element.from && element.from.username !== user?.username
}

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	type Ret = {fetch: any; user: User| null; invites: Invite[], friend_requests: Invite[]}
	let ret: Ret;

	try {
		user = await get("/user/me");
		const invites: Invite[] = await unwrap(get("/user/me/invites"));
		const friend_requests: Invite[] = await get("/user/me/friends/requests");
		ret = {
			fetch: fetch,
			user: user,
			invites: invites.filter(isFromOther),
			friend_requests: friend_requests.filter(isFromOther),
		}
	} catch (err) {
		ret = {fetch: fetch, user: null, invites: [], friend_requests: []};
		console.log("error in layout.ts: ", err);
	}
	return ret;
}) satisfies LayoutLoad;
