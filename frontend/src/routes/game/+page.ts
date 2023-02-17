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

	const joined = await get(`/game/joined`);
	const joinable = await get(`/game?member=false`);
	const rooms = [];

	for (let member of joined) {
		member.room.joined = true;
		member.room.member = member;
		rooms.push(member.room);
	}

	for (let room of joinable) {
		room.joined = false;
		rooms.push(room);
	}
	console.log(rooms);
	
	return { rooms };
}) satisfies PageLoad;

function setJoined(rooms: GameRoom[], joined: boolean): GameRoom[] {
    return rooms.map((room) => { room.joined = joined; return room });
}
