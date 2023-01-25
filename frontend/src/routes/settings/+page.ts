import { BACKEND } from "$lib/constants";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = (async ({ fetch }) => {
	const response = await fetch(`${BACKEND}/account/auth_req`, {
		credentials: 'include'
	});

	if (!response.ok)
		throw error(response.status, response.message);

	let auth_req = await response.json();
	return { auth_req: auth_req };
}) satisfies PageLoad;
