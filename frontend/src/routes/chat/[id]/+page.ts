import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types"

export const load = (async ({ fetch, params }: any) => {
    const response = await fetch("http://localhost:3000/chat/room?id=" + params.id, {
			credentials: "include",
		});
	
	if (!response.ok) {
		throw error(response.status, (await response.json()).message);
	}

    return { room: (await response.json()) };
}) satisfies PageLoad

