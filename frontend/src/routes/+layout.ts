import { get } from "$lib/Web";
import type {  User, Invite } from "$lib/types";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	try {
		const user: User | null = await get("/user/me");
		const invites: Invite[] = await get("/user/me/invites");
		const invites_received = invites.filter((invite) => invite?.to?.id === user?.id);
		const invites_send = invites.filter((invite) => invite?.from?.id === user?.id);
		const auth_req = await get("/user/me/auth_req");
	
		if (user) {
			user.auth_req = auth_req.auth_req;
		}
	
		return { user, invites, invites_received, invites_send }
	} catch (err) {
		return { user: null, invites: null, invites_received: null, invites_send: null }
	}
}) satisfies LayoutLoad;
