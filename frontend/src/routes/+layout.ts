import type { Invite, User, GameState } from "$lib/entities";
import type { LayoutLoad } from "./$types";
import { updateStore, userStore, inviteStore, friendStore, teamStore, gameStateStore, blockStore } from "$lib/stores";
import { get } from "$lib/Web";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	let user: User | null = null;

	try {
		user = await get(`/user/me`) as User;
		user.auth_req = await get(`/user/me/auth_req`);
		const friends: User[] = await get(`/user/me/friends`);
		const blocked: User[] = await get(`/user/me/blocked`);
		const invites: Invite[] = await get(`/user/me/invites`);
		const gameStates: GameState[] = await Promise.all(friends
			.filter((user) => user.activeRoomId)
			.map((user) => get(`/game/id/${user.activeRoomId}/state`)));
		const teams = gameStates.map((state) => state.teams).flat();

		updateStore(inviteStore, invites);
		updateStore(teamStore, teams);
		updateStore(gameStateStore, gameStates);
		updateStore(userStore, [user, ...friends]);
		updateStore(friendStore, friends.map(({ id }) => { return { id } }));
		updateStore(blockStore, blocked.map(({ id }) => { return { id } }));

	} catch (err) { }

	return { user };
}) satisfies LayoutLoad;
