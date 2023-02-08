import { get } from "$lib/Web";
import type {  User, Invite } from "$lib/types";
import type { LayoutLoad } from "./$types";

export const ssr = false;

//TODO check if after a uses accepts an invite the invite send is also properly removed
export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	try {
		const user: User | null = await get("/user/me");
		const invites: Invite[] = await get("/user/me/invites");
		const invites_received = invites.filter((invite) => invite?.to?.id === user?.id);
		const invites_send = invites.filter((invite) => invite?.from?.id === user?.id);
		const auth_req = await get("/user/me/auth_req");
		if (user)
			user.auth_req = auth_req.auth_req;
	
		return { user, invites_received, invites_send }
	} catch (err) {
		console.log("+layout.ts", err);
		return { user: null, invites_received: [], invites_send: []};
	}
}) satisfies LayoutLoad;
