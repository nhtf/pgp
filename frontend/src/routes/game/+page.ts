import type { PageLoad } from "./$types"
import { get } from "$lib/Web";
import { error } from "@sveltejs/kit";

export const ssr = false;

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	try {
		const mine = await get("/game?member=true");
		const joinable = await get("/game?member=false");

		return { mine, joinable };
	}
	catch (err: any) {
		throw error(401, err.message);
	}
}) satisfies PageLoad;
