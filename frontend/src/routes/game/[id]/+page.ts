import type { GameRoom, GameRoomMember } from "$lib/entities";
import type { PageLoad } from "./$types"
import { get } from "$lib/Web";
import { unwrap } from "$lib/Alert";

export const ssr = false;

export const load: PageLoad = async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: GameRoom = await unwrap(get(`/game/id/${params.id}`));
	const member = room.self as GameRoomMember;

	return { room, member };
};
