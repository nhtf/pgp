import type { PageLoad } from "./$types"
import { updateStore, roomStore, userStore, memberStore } from "$lib/stores"
import { GameRoom, GameRoomMember, User } from "$lib/entities";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const ssr = false;

export const load: PageLoad = async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: GameRoom = await unwrap(get(`/game/${params.room}`));
	const users: User[] = await unwrap(get(`/game/${params.room}/users`));
	const members: GameRoomMember[] = await unwrap(get(`/game/${params.room}/members`));

	updateStore(User, users);
	updateStore(GameRoom, room);
	updateStore(GameRoomMember, members);

	return { room };
};
