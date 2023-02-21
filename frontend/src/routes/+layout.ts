import { get } from "$lib/Web";
import type { User, Invite } from "$lib/entities";
import type { LayoutLoad } from "./$types";
import { userStore, inviteStore } from "../stores";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	let user: User | null = null;
	let users: User[] | null = null;
	let invites: Invite[] | null = null;
	let invites_send: Invite[] | null = null;
	let invites_received: Invite[] | null = null;

	try {
		user = await get(`/user/me`);
		users = await get(`/users`);
		invites = await get(`/user/me/invites`);
		user!.auth_req = (await get(`/user/me/auth_req`)).auth_req;
	
		userStore.update((_) => new Map(users!.map((user) => [user.id, user])));
		inviteStore.update((_) => new Map(invites!.map((invite) => [invite.id, invite])));

		invites_send = invites!.filter((invite) => invite?.from?.id === user?.id);
		invites_received = invites!.filter((invite) => invite?.to?.id === user?.id);
	} catch (err) {}

	return { user, users, invites, invites_received, invites_send };
}) satisfies LayoutLoad;
