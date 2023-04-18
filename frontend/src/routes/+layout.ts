import type { Invite, User } from "$lib/entities";
import type { LayoutLoad } from "./$types";
import { get } from "$lib/Web";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	let user: User | null = null;
	let blocked: User[] | null = null;
	let invites: Invite[] | null = null;

	try {
		user = await get(`/user/me`) as User;
		blocked = await get(`/user/me/blocked`) as User[];
		invites = await get(`/user/me/invites`) as Invite[];
	} catch (err) { }

	return { user, blocked, invites };
}) satisfies LayoutLoad;
