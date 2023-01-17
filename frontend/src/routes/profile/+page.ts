import { redirect } from "@sveltejs/kit";
import { doFetch } from "../../stores";
import type { PageLoad } from "./$types"

export const ssr = false;

export const load = (async ({ fetch }: any) => {
    const response = await doFetch(fetch, "/account/whoami", {
		credentials: "include",
	});

	if (!response.ok) {
		throw redirect(307, "/account_setup");
	} else {
		const user = await response.json();
	
		throw redirect(307, "/profile/" + user.username);
	}
}) satisfies PageLoad
