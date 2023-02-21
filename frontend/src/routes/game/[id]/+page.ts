import { get } from "$lib/Web";
import { unwrap } from "$lib/Alert";

export const ssr = false;

export async function load({ fetch, params }: any) {
	window.fetch = fetch;

	const member = await unwrap(get(`/game/joined/id/${params.id}`));
	const room = member.room;

	return { params, member, room };
};
