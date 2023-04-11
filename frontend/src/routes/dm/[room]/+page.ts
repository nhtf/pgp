import type { PageLoad } from "./$types"
import { User, DMRoom, type Message } from "$lib/entities";
import { userStore, roomStore, updateStore  } from "$lib/stores";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: DMRoom = await unwrap(get(`/dm/${params.room}`));
	const messages: Message[] = await unwrap(get(`/dm/${params.room}/messages`));

	updateStore(roomStore, room, DMRoom);
	updateStore(userStore, room.other, User);

    return { room, messages };
}) satisfies PageLoad;
