import type { GameRoom, GameRoomMember } from "$lib/entities";
import type { PageLoad } from "./$types"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const ssr = false;

export const load: PageLoad = async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: GameRoom = await unwrap(get(`/game/${params.id}`));

	return { room, member: room.self as GameRoomMember };
};
