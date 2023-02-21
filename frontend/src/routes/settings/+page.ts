import type { PageLoad } from "./$types";
import { get } from "$lib/Web"
import { unwrap } from "$lib/Alert"

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const { auth_req } = await unwrap(get(`/user/me/auth_req`));

	return { auth_req };
}) satisfies PageLoad;
