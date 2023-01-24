import type { PageLoad } from "./$types"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export async function load({ fetch }: any) {
	window.fetch = fetch;

	const rooms = await unwrap(get("/game/mine"));

	return { rooms };
};
