import { get } from "$lib/Web";
import type { User } from "$lib/types";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	try {
		const user: User | null = await get("/user/me");

		return { fetch, user };
	} catch (err) {
		console.log("error in layout.ts: ", err);
		return { fetch };
	}
}) satisfies LayoutLoad;
