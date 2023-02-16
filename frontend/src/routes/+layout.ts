import { get } from "$lib/Web";
import type {  User, Invite } from "$lib/types";
import type { LayoutLoad } from "./$types";
import { userStore, inviteStore } from "../stores";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	try {
		const user: User = await get("/user/me");
		const invites: Invite[] = await get("/user/me/invites");
		const { auth_req } = await get("/user/me/auth_req");
	
		user.auth_req = auth_req;
	
		userStore.update((users) => users.set(user.id, user));
		inviteStore.update((inv) => {
			invites.forEach((invite) => {
				inv.set(invite.id, invite);
			});
		
			return inv
		})

		const invites_received = invites.filter((invite) => invite?.to?.id === user?.id);
		const invites_send = invites.filter((invite) => invite?.from?.id === user?.id);
	
		return { user, invites, invites_received, invites_send }
	} catch (err) {
		return { user: null, invites: null, invites_received: null, invites_send: null }
	}
}) satisfies LayoutLoad;
