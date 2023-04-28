import type { User, ChatRoom } from "$lib/entities";
import type { PageLoad } from "./$types"
import { Role } from "$lib/enums"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";
import { error } from "@sveltejs/kit";

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: ChatRoom = await unwrap(get(`/chat/${params.room}`));
	const banned: User[] = await unwrap(get(`/chat/${params.room}/bans`));

	if (room.self && room.self.role < Role.ADMIN) {
		throw error(401, "Must be admin or owner");
	}

    return { room, banned };
}) satisfies PageLoad;
