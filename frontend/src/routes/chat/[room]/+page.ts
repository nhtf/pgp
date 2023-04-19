import type { PageLoad } from "./$types"
import type { User, ChatRoom, ChatRoomMember, Message } from "$lib/entities";
import { Role } from "$lib/enums"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: ChatRoom = await unwrap(get(`/chat/${params.room}`));
	const users: User[] = await unwrap(get(`/chat/${params.room}/users`));
	const members: ChatRoomMember[] = await unwrap(get(`/chat/${params.room}/members`));
	const messages: Message[] = await unwrap(get(`/chat/${params.room}/messages`));

	let banned: User[] | null = null;

	if (room.self!.role >= Role.ADMIN) {
		banned = await unwrap(get(`/chat/${params.room}/bans`)) as User[];
	}

    return { room, members, users, messages, banned };
}) satisfies PageLoad;
