import { error, redirect } from "@sveltejs/kit";
import { doFetch } from "../../../stores";
import type { PageLoad } from "./$types"

export const load = (async ({ fetch, params }: any) => {
	let response = await doFetch(fetch, "/account/whoami", { credentials: "include" });

	if (!response.ok) {
		throw redirect(307, "/profile"); // TODO
	}

	const user = await response.json();

	response = await doFetch(fetch, `/room/${params.room}` , { credentials: "include" });

	if (!response.ok) {
		const err = await response.json();
	
		throw error(response.status, err.message);
	}

	const room = await response.json();

	response = await doFetch(fetch, "/chat/invites/room", { credentials: "include" }, { id: room.id });

	if (!response.ok) {
		const err = await response.json();
	
		throw error(response.status, err.message);
	}

	const invites = await response.json();

    return { fetch, user, room, invites };
}) satisfies PageLoad

