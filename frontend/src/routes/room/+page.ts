import { unwrap } from "$lib/Alert";
import type { ChatRoom } from "$lib/types";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch }) => {
    window.fetch = fetch;

    const mine: ChatRoom[] = await unwrap(get("/room/all"));
    const joinable: ChatRoom[] = [];
    // await unwrap(get("/room/joinable"));

    return { fetch, mine, joinable };
}) satisfies PageLoad;

