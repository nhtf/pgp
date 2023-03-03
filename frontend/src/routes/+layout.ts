import type { User } from "$lib/entities";
import type { LayoutLoad } from "./$types";
import { userStore, inviteStore, updateStore, friendIdStore } from "$lib/stores";
import { get } from "$lib/Web";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	let user: User | null = null;
	let friends: User[] | null = null;

	try {
		user = await get(`/user/me`);
		user!.auth_req = await get(`/user/me/auth_req`);
		friends = await get(`/user/me/friends`);
	
		const invites = await get(`/user/me/invites`);

		updateStore(userStore, [user!, ...friends!]);
		updateStore(inviteStore, invites!);
		friendIdStore.set(friends!.map((friend) => friend.id));

	} catch (err) { }

	return { user, friends };
}) satisfies LayoutLoad;
