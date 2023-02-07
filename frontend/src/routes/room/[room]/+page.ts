import type { Message, ChatRoom, Role } from "$lib/types";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	// TODO: stop alerting
	const room: ChatRoom = await unwrap(get(`/room/id/${params.room}`));
	const role: Role = await unwrap(get(`/room/id/${params.room}/role`));
	const messages: Message[] = await unwrap(get(`/room/id/${params.room}/messages`));

    return { room, messages, role };
}) satisfies PageLoad;

