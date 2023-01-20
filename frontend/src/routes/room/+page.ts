import { unwrap } from "$lib/Alert";
import type { SerializedRoom } from "$lib/types";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch }) => {
    const rooms: SerializedRoom[] = await unwrap(get(fetch, "/room"));

    console.log(rooms);

    return { fetch, rooms };
}) satisfies PageLoad;

