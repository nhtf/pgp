import type { User, ChatRoom, Member, Message } from "$lib/entities";
import { Role } from "$lib/enums"
import type { PageLoad } from "./$types"
import { userStore, memberStore, updateStore  } from "../../../lib/stores";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ parent, fetch, params }) => {
	window.fetch = fetch;

	const { user } = await unwrap(parent());
	const room: ChatRoom = await unwrap(get(`/chat/id/${params.room}`));
	const members: Member[] = await unwrap(get(`/chat/id/${params.room}/members`));
	const messages: Message[] = await unwrap(get(`/chat/id/${params.room}/messages`));
	const member: Member = members.find((member) => member.user.id === user!.id)!;

	let banned: User[] | null = null;

	if (member.role >= Role.ADMIN) {
		banned = await unwrap(get(`/chat/id/${params.room}/bans`));
	
		updateStore(userStore, banned!);
	}

	updateStore(memberStore, members);
	updateStore(userStore, members.map((member) => member.user));

    return { room, member, members, messages, banned };
}) satisfies PageLoad;
