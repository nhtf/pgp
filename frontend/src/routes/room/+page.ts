import { unwrap } from "$lib/Alert";
import type { Room } from "$lib/types";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch }) => {
    const rooms: Room[] = await unwrap(get("/room"));

    return { fetch, rooms };
}) satisfies PageLoad;

