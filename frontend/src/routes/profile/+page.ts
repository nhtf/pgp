import type { PageLoad } from "./$types"
import { redirect } from "@sveltejs/kit";

export const load: PageLoad = (async ({ fetch, parent }: any) => {
	window.fetch = fetch;

	const { user } = await parent();
	const URL = user ? `/profile/${user.username}` : `/account_setup`;
	
	throw redirect(302, URL);
}) satisfies PageLoad;
