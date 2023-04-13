import type { PageLoad } from "./$types";

export const load: PageLoad = (async ({ fetch, parent }) => {
	window.fetch = fetch;

	const { user } = await parent();

	return {  };
}) satisfies PageLoad;