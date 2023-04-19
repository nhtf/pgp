import type { GameRoom, GameRoomMember, User } from "$lib/entities";
import type { PageLoad } from "./$types"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const ssr = false;

export const load: PageLoad = async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: GameRoom = await unwrap(get(`/game/${params.room}`));
	const users: User[] = await unwrap(get(`/game/${params.room}/users`));
	const members: GameRoomMember[] = await unwrap(get(`/game/${params.room}/members`));

	return { room, users, members };
};
