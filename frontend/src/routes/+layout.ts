import type { Invite, User, GameState } from "$lib/entities";
import type { LayoutLoad } from "./$types";
import { updateStore, userStore, inviteStore, friendStore, gameStateStore } from "$lib/stores";
import { get } from "$lib/Web";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	let user: User | null = null;
	let friends: User[] | null = null;

	try {
		user = await get(`/user/me`) as User;
		user.auth_req = await get(`/user/me/auth_req`);
		friends = await get(`/user/me/friends`) as User[];

		const invites: Invite[] = await get(`/user/me/invites`);
		const gameStates: GameState[] = await Promise.all(friends
			.filter((user) => user.activeRoomId)
			.map((user) => get(`/game/id/${user.activeRoomId}/gameStates`)));
	
		updateStore(inviteStore, invites);
		updateStore(gameStateStore, gameStates);
		updateStore(userStore, [user, ...friends]);
		updateStore(friendStore, friends.map(({ id }) => { return { id } }));

	} catch (err) { }

	return { user, friends };
}) satisfies LayoutLoad;
