import type { LayoutLoad } from "./$types";
import { Invite, User, Entity } from "$lib/entities";
import { updateStore, blockStore } from "$lib/stores";
import { get } from "$lib/Web";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	let user: User | null = null;

	try {
		user = await get(`/user/me`) as User;
	
		const blocked: User[] = await get(`/user/me/blocked`);
		const invites: Invite[] = await get(`/user/me/invites`);

		updateStore(User, user);
		updateStore(Invite, invites);
		updateStore(Entity, blocked.map(({ id }) => { return { id } }), blockStore);

	} catch (err) { }

	return { user };
}) satisfies LayoutLoad;
