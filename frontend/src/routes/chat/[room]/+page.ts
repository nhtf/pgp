import type { ChatRoom, Member, Message } from "$lib/types";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: ChatRoom = await unwrap(get(`/chat/id/${params.room}`));
	const members: Member[] = await unwrap(get(`/chat/id/${params.room}/members`));
	const messages: Message[] = await unwrap(get(`/chat/id/${params.room}/messages`));

    return { room, members, messages };
}) satisfies PageLoad;

