import type { User, ChatRoom, Member, Message } from "$lib/entities";
import type { PageLoad } from "./$types"
import { userStore, roomStore, memberStore, updateStore  } from "$lib/stores";
import { Role } from "$lib/enums"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ parent, fetch, params }) => {
	window.fetch = fetch;

	const { user } = await unwrap(parent());
	const users: User[] = await unwrap(get(`/chat/id/${params.room}/users`));
	const room: ChatRoom = await unwrap(get(`/chat/id/${params.room}`));
	const members: Member[] = await unwrap(get(`/chat/id/${params.room}/members`));
	const messages: Message[] = await unwrap(get(`/chat/id/${params.room}/messages`));

	const member: Member = members.find((member) => member.userId === user!.id)!;

	console.log(members);
	updateStore(userStore, users);
	updateStore(roomStore, [room]);
	updateStore(memberStore, members);

	let banned: User[] | null = null;

	if (member.role >= Role.ADMIN) {
		banned = await unwrap(get(`/chat/id/${params.room}/bans`));
	
		updateStore(userStore, banned!);
	}

    return { room, member, members, messages, banned };
}) satisfies PageLoad;
