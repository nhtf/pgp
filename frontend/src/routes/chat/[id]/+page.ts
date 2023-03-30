import type { User, ChatRoom, Member, Message } from "$lib/entities";
import type { PageLoad } from "./$types"
import { userStore, roomStore, memberStore, updateStore  } from "$lib/stores";
import { Role } from "$lib/enums"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: ChatRoom = await unwrap(get(`/chat/${params.id}`));
	const users: User[] = await unwrap(get(`/chat/${params.id}/users`));
	const members: Member[] = await unwrap(get(`/chat/${params.id}/members`));
	const messages: Message[] = await unwrap(get(`/chat/${params.id}/messages`));

	updateStore(roomStore, room);
	updateStore(userStore, users);
	updateStore(memberStore, members);

	let banned: User[] | null = null;

	if (room.self!.role >= Role.ADMIN) {
		banned = await unwrap(get(`/chat/${params.id}/bans`));
	
		updateStore(userStore, banned!);
	}

    return { room, members, messages, banned };
}) satisfies PageLoad;
