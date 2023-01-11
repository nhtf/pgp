import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types"

export const load = (async ({ fetch, params }: any) => {
	const whoami = "http://localhost:3000/account/whoami";
	const endpoint = "http://localhost:3000/chat/room";

    let response = await fetch(whoami, {
		credentials: "include",
	});

	if (!response.ok) {
		return {
			status: 302,
			redirect: "/login" // TODO
		}
	}

	const user = await response.json();

    response = await fetch(endpoint + "?id=" + params.id, {
			credentials: "include",
		});
	
	if (!response.ok) {
		throw error(response.status, (await response.json()).message);
	}

	const room = await response.json();

    return { fetch: fetch, user: user, room: room };
}) satisfies PageLoad

