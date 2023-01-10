import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = (async ({ fetch}: any) => {
	const response = await fetch('http://localhost:3000/account/auth_req', {
		credentials: 'include'
	});

	if (!response.ok)
		throw error(response.status, response.message);

	let auth_req = await response.json();
	return { auth_req: auth_req };
}) satisfies PageLoad;
