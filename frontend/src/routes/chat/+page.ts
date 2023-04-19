import type { ChatRoom} from "$lib/entities";
import type { PageLoad } from "./$types"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const joined: ChatRoom[] = await unwrap(get(`/chat`, { filter: "joined" }));
	const joinable: ChatRoom[] = await unwrap(get(`/chat`, { filter: "joinable" }));
	const rooms = joined.concat(joinable);

	return { rooms };
}) satisfies PageLoad;
