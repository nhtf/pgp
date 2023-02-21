import type { ChatRoom, Member, Message } from "$lib/entities";
import type { PageLoad } from "./$types"
import { userStore, memberStore, updateStore  } from "../../../stores";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: ChatRoom = await unwrap(get(`/chat/id/${params.room}`));
	const members: Member[] = await unwrap(get(`/chat/id/${params.room}/members`));
	const messages: Message[] = await unwrap(get(`/chat/id/${params.room}/messages`));

	updateStore(memberStore, members);
	updateStore(userStore, members.map((member) => member.user));

    return { room, members, messages };
}) satisfies PageLoad;
