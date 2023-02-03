import type { Room } from "$lib/types";
import { get } from "$lib/Web";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch }) => {
    window.fetch = fetch;

    try {
        const roomsJoined: Room[] = await get("/room/", "member=true");
        const roomsJoinable: Room[] = await get("/room/", "member=false");
        console.log("roomsJoined: ", roomsJoined);
        console.log("roomsJoinable: ", roomsJoinable);
        // await unwrap(get("/room/joinable"));
        return { fetch, roomsJoined, roomsJoinable };
    }
    catch (err) {
        console.log(err);
        throw error(401, "Unauthorized, User needs to be logged in");
    }
}) satisfies PageLoad;

