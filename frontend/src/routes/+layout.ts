import type { Invite, User } from "$lib/entities";
import type { LayoutLoad } from "./$types";
import { redirect } from '@sveltejs/kit';
import { get } from "$lib/Web";

export const ssr = false;
//export const prerender = true;

export const load: LayoutLoad = (async ({ fetch, url }) => {
	window.fetch = fetch;

	let user: User | null = null;
	let blocked: User[] | null = null;
	let invites: Invite[] | null = null;

	try {
		user = await get(`/user/me`) as User;
		blocked = await get(`/user/me/blocked`) as User[];
		invites = await get(`/user/me/invites`) as Invite[];
	} catch (err) { }

	if (user && user.username === null && !url.pathname.includes("/account_setup")) {
		throw redirect(302, `/account_setup`);
	}

	return { user, blocked, invites };
}) satisfies LayoutLoad;
