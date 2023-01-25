import { unwrap } from "$lib/Alert";
import type { Room } from "$lib/types";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch }) => {
    const my_rooms: Room[] = await unwrap(get("/room/mine"));
    const visible_rooms: Room[] = await unwrap(get("/room"));

    return { fetch, my_rooms, visible_rooms };
}) satisfies PageLoad;

