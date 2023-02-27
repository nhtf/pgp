import type { ChatRoom } from "$lib/entities";
import type { PageLoad } from "./$types"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";
import { roomStore, updateStore } from "$lib/stores";

export const load: PageLoad = (async ({ fetch }) => {
    window.fetch = fetch;

    const roomsJoined: ChatRoom[] = setJoined(await unwrap(get(`/chat`, { member: true })), true);
    const roomsJoinable: ChatRoom[] = setJoined(await unwrap(get(`/chat`, { member: false })), false);
    const rooms = roomsJoined.concat(roomsJoinable);

    updateStore(roomStore, rooms);

    return { rooms };
}) satisfies PageLoad;


function setJoined(rooms: ChatRoom[], joined: boolean): ChatRoom[] {
    return rooms.map((room) => { room.joined = joined; return room });
}
