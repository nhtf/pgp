import type { PageLoad } from "./$types"
import { User, ChatRoom, ChatRoomMember } from "$lib/entities";
import {updateStore } from "$lib/stores";
import { Role } from "$lib/enums"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";
import { error } from "@sveltejs/kit";

export const load: PageLoad = (async ({ parent, fetch, params }) => {
	window.fetch = fetch;

	const { user } = await unwrap(parent());
	const room: ChatRoom = await unwrap(get(`/chat/${params.room}`));
	const banned: User[] = await unwrap(get(`/chat/${params.room}/bans`));
	const members: ChatRoomMember[] = await unwrap(get(`/chat/${params.room}/members`));

	if (room.self!.role < Role.ADMIN) {
		throw error(401, "Must be admin or owner");
	}

	updateStore(User, banned);
	updateStore(ChatRoom, room);
	updateStore(ChatRoomMember, members);

    return { room, members, banned };
}) satisfies PageLoad;
