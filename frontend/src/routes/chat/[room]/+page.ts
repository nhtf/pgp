import type { PageLoad } from "./$types"
import { Entity, User, ChatRoom, Member, type Message } from "$lib/entities";
import { userStore, roomStore, memberStore, updateStore  } from "$lib/stores";
import { Role } from "$lib/enums"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: ChatRoom = await unwrap(get(`/chat/${params.room}`));
	const users: User[] = await unwrap(get(`/chat/${params.room}/users`));
	const members: Member[] = await unwrap(get(`/chat/${params.room}/members`));
	const messages: Message[] = await unwrap(get(`/chat/${params.room}/messages`));

	updateStore(roomStore, room, ChatRoom);
	updateStore(userStore, users, User);
	updateStore(memberStore, members, Member);

	let banned: User[] | null = null;

	if (room.self!.role >= Role.ADMIN) {
		banned = await unwrap(get(`/chat/${params.room}/bans`));
	
		updateStore(userStore, banned!, Entity);
	}

    return { room, members, messages, banned };
}) satisfies PageLoad;
