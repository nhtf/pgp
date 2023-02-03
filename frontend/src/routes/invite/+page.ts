import { unwrap } from "$lib/Alert";
import type { Invite, User } from "$lib/types";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

let user : User | null;

function isFromUser(element: Invite) {
    return element.from?.username === user?.username;
}

function isFromOther(element: Invite) {
    return element.from && element.from.username !== user?.username
}

export const load: PageLoad = (async ({ fetch }) => {
    window.fetch = fetch;
    const invites: Invite[] = await unwrap(get("/user/me/invites"));
    const friend_requests: Invite[] = await get("/user/me/friends/requests");
    user = await get("/user/me");

    const room_send = invites.filter(isFromUser);
    const room_received = invites.filter(isFromOther);
    const friend_send = friend_requests.filter(isFromUser);
    const friend_received = friend_requests.filter(isFromOther);
    console.log("Invites", {room_send, room_received, friend_received, friend_send});
    return { fetch, room_send, room_received, friend_received, friend_send };
}) satisfies PageLoad;

