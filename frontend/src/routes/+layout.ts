import type { Invite, User } from "$lib/entities";
import type { LayoutLoad } from "./$types";
import { updateStore, userStore, inviteStore, blockStore, friendStore } from "$lib/stores";
import { get } from "$lib/Web";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	let user: User | null = null;

	try {
		user = await get(`/user/me`) as User;
	
		const blocked: User[] = await get(`/user/me/blocked`);
		const invites: Invite[] = await get(`/user/me/invites`);
	
		updateStore(userStore, user);
		updateStore(inviteStore, invites);
		updateStore(blockStore, blocked.map(({ id }) => { return { id } }));

		// TODO: remove
		const friends: User[] = await get(`/user/me/friends`);

		updateStore(friendStore, friends);
		updateStore(userStore, friends);

	} catch (err) { }

	return { user };
}) satisfies LayoutLoad;
