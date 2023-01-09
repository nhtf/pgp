import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = (async ({ fetch, parent }: any) => {
	const { username } = await parent();

	const response = await fetch("http://localhost:3000/chat/rooms", {
		credentials: "include"
	});

	if (!response.ok) {
		throw error(response.status, "Failed to load user chatrooms");
	}

	let item = await response.json();

	return { rooms: item };
}) satisfies PageLoad;
