import { unwrap } from "$lib/Alert";
import type { Room } from "$lib/types";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch }) => {
    window.fetch = fetch;

    const roomsJoined: Room[] = await unwrap(get("/room", { member: true }));
    const roomsJoinable: Room[] = await unwrap(get("/room", { member: false }));
    
    return { roomsJoined, roomsJoinable };
}) satisfies PageLoad;

