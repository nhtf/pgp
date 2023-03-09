import { get } from "$lib/Web";
import { unwrap } from "$lib/Alert";

export const ssr = false;

export async function load({ fetch, params }: any) {
	window.fetch = fetch;

	const room = await unwrap(get(`/game/id/${params.id}`));
	const member = room.self;

	return { params, room, member };
};
