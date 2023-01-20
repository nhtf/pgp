import { get } from "$lib/Web";
import type { User } from "$lib/types";
import type { LayoutLoad } from "./$types";

export const _default_profile_image = "https://www.w3schools.com/howto/img_avatar.png";
export const ssr = false;

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	try {
		const user: User = await get(window.fetch, "/user/me");

		return { fetch, user };
	} catch (err) {
		console.log("error in layout.ts: ", err);
		return { fetch };
	}
}) satisfies LayoutLoad;
