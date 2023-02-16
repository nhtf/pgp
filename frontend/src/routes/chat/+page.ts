import { unwrap } from "$lib/Alert";
import type { ChatRoom } from "$lib/types";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch }) => {
    window.fetch = fetch;

    const roomsJoined: ChatRoom[] = setJoined(await unwrap(get("/chat", { member: true })), true);
    const roomsJoinable: ChatRoom[] = setJoined(await unwrap(get("/chat", { member: false })), false);

    return { roomsJoined, roomsJoinable };
}) satisfies PageLoad;


function setJoined(rooms: ChatRoom[], joined: boolean): ChatRoom[] {
    return rooms.map((room) => { room.joined = joined; return room });
}
