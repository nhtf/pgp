import type { Room, Message } from "$lib/types";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch, params }) => {
	window.fetch = fetch;

	const room: Room = await unwrap(get(`/room/id/${params.room}`));
	const messages: Message[] = await unwrap(get(`/room/${params.room}/messages`));
	const roomy: any = await unwrap(get(`/room/id/${params.room}`));
	const roomsJoined: Room[] = await get("/room/", "member=true");
    const roomsJoinable: Room[] = await get("/room/", "member=false");
	console.log("roomy: ", roomy);
	console.log("messages", messages);

    return { fetch, room, roomsJoined, roomsJoinable,  messages};
}) satisfies PageLoad;

