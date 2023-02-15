import type { PageLoad } from "./$types"
import { get } from "$lib/Web";
import type { GameRoom } from "$lib/types";

export const ssr = false;

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const mine: GameRoom[] = setJoined(await get("/game?member=true"), true);
	const joinable: GameRoom[] = setJoined(await get("/game?member=false"), false);
	const rooms = mine.concat(joinable);

	return { rooms, mine, joinable };
}) satisfies PageLoad;

function setJoined(rooms: GameRoom[], joined: boolean): GameRoom[] {
    return rooms.map((room) => { room.joined = joined; return room });
}
