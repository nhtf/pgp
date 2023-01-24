import type { Room } from "$lib/types";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch, params }) => {
	const room: Room = await unwrap(get(`/room/id/${params.room}`));

    return { fetch, room };
}) satisfies PageLoad;

