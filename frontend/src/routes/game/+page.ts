import type { PageLoad } from "./$types"
import { get } from "$lib/Web";
import type { GameRoom } from "$lib/types";
import { error } from '@sveltejs/kit';

export const ssr = false;

export const load: PageLoad = (async ({ fetch, parent }) => {
	window.fetch = fetch;

	const { user } = await parent();

	if (!user) {
		throw error(401, "Unauthorized");
	}

	const mine: GameRoom[] = setJoined(await get("/game?member=true"), true);
	const joinable: GameRoom[] = setJoined(await get("/game?member=false"), false);
	const rooms = mine.concat(joinable);

	console.log(rooms[0]);
	
	return { rooms, mine, joinable };
}) satisfies PageLoad;

function setJoined(rooms: GameRoom[], joined: boolean): GameRoom[] {
    return rooms.map((room) => { room.joined = joined; return room });
}
