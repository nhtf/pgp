import type { ChatRoom } from "$lib/types";
import { get } from "$lib/Web";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch }) => {
    window.fetch = fetch;

    try {
        const mine: ChatRoom[] = await get("/room/all");
        const joinable: ChatRoom[] = [];
        // await unwrap(get("/room/joinable"));
        return { fetch, mine, joinable };
    }
    catch (err) {
        console.log(err);
        throw error(401, "Unauthorized, User needs to be logged in");
    }
}) satisfies PageLoad;

