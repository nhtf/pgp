import type { PageLoad } from "./$types";
import { get } from "$lib/Web"

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const { auth_req } = await get(`/user/me/auth_req`);

	return { auth_req };
}) satisfies PageLoad;
