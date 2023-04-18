import type { DMRoom, Message } from "$lib/entities";
import type { PageLoad } from "./$types"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: DMRoom = await unwrap(get(`/dm/${params.room}`));
	const messages: Message[] = await unwrap(get(`/dm/${params.room}/messages`));

    return { room, messages, other: room.other! };
}) satisfies PageLoad;
