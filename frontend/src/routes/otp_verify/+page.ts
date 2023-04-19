import type { PageLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: PageLoad = (async ({ fetch, parent }) => {
	window.fetch = fetch;

	const { user } = await parent();

	if (user)
		throw redirect(302, `/profile/${encodeURIComponent(user.username)}`);
}) satisfies PageLoad;
