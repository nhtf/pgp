import { get } from "$lib/Web";
import type { User } from "$lib/types";
import type { LayoutLoad } from "./$types";

export const _default_profile_image = "https://www.w3schools.com/howto/img_avatar.png";

export const load: LayoutLoad = (async ({ fetch }) => {
	let user: User | undefined;

	try {
		user = await get(fetch, "/user/me");
	} catch (err) {
		user = undefined;
	}

    return { fetch, user };
}) satisfies LayoutLoad;
