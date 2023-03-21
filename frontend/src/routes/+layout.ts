import type { Invite, User, GameState } from "$lib/entities";
import type { LayoutLoad } from "./$types";
import { updateStore, userStore, inviteStore, friendStore, gameStateStore, blockStore } from "$lib/stores";
import { get } from "$lib/Web";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	let user: User | null = null;

	try {
		user = await get(`/user/me`) as User;
	
		const friends: User[] = await get(`/user/me/friends`);
		const blocked: User[] = await get(`/user/me/blocked`);
		const invites: Invite[] = await get(`/user/me/invites`);
		const gameStates: GameState[] = await Promise.all(friends
			.filter((user) => user.activeRoomId)
			.map((user) => get(`/game/id/${user.activeRoomId}/state`)));

		updateStore(inviteStore, invites);
		updateStore(gameStateStore, gameStates);
		updateStore(userStore, [user, ...friends]);
		updateStore(blockStore, blocked.map(({ id }) => { return { id } }));
		updateStore(friendStore, friends.map(({ id }) => { return { id } }));

	} catch (err) { }

	return { user };
}) satisfies LayoutLoad;
