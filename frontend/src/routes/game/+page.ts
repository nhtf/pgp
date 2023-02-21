import type { GameRoom } from "$lib/entities";
import type { PageLoad } from "./$types"
import { get } from "$lib/Web";
import { unwrap } from "$lib/Alert";

export const ssr = false;

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const joined = await unwrap(get(`/game/joined`));
	const joinable = await unwrap(get(`/game?member=false`));
	const rooms: GameRoom[] = [];

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
