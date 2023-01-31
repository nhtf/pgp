import type { PageLoad } from "./$types"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export async function load({ fetch }: any) {
	window.fetch = fetch;

	const mine = await unwrap(get("/game?member=true"));
	const joinable = await unwrap(get("/game?member=false"));

	return { mine, joinable };
};
