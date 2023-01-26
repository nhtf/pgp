import { get } from "$lib/Web";
import type { User } from "$lib/types";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const ret: any = { fetch };

	try {
		const user: User | null = await get("/user/me");

		ret.user = user;
	} catch (err) {
		console.log("error in layout.ts: ", err);
	}

	return ret;
}) satisfies LayoutLoad;
