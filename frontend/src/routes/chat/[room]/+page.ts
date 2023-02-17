import type { Message, ChatRoom, Role, Member } from "$lib/types";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: ChatRoom = await unwrap(get(`/chat/id/${params.room}`));
	const messages: Message[] = await unwrap(get(`/chat/id/${params.room}/messages`));
	const members: Member[] = await unwrap(get(`/chat/id/${params.room}/members`));
	const role: Role = await unwrap(get(`/chat/id/${params.room}/role`));

    return { room, members, messages, role };
}) satisfies PageLoad;

