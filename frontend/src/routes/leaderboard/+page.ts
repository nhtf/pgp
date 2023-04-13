import type { PageLoad } from "./$types";
import { type Stat, User } from "$lib/entities";
import { updateStore } from "$lib/stores";
import { dedup } from "$lib/util";
import { get } from "$lib/Web";

export const ssr = false;

export const load: PageLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	const leaderBoardClassic = await get('/stat', {gamemode: 0, sort: "DESC"});
	const leaderBoardVR = await get('/stat', {gamemode: 1, sort: "DESC"});
	const leaderBoardModern = await get('/stat', {gamemode: 2, sort: "DESC", team_count: 2});
	const leaderBoardModern4p = await get('/stat', {gamemode: 2, sort: "DESC", team_count: 4});

	const leaderBoard: Stat[] = await get('/stat', { sort: "DESC" });
	// const leaderBoardModern4p = await get('/Leaderboard?gamemode=3');
	console.log("leaderboardclass: ", leaderBoardClassic);
	console.log("leaderboardvr: ", leaderBoardVR);
	console.log("leaderboardmodern: ", leaderBoardModern);
	// console.log("leaderboard m4p: ", leaderBoardModern4p);

	const users = await Promise.all(
	   dedup(leaderBoard)
	  .map(({ id }) => get(`/user/id/${id}`) as Promise<User>)
	);

	updateStore(User, users);

	return { lb: [
		{id: "classic", data: leaderBoardClassic},
		{id: "vr", data: leaderBoardVR},
		{id: "modern", data: leaderBoardModern},
		{id: "modern4p", data: leaderBoardModern4p},
	] };
}) satisfies PageLoad;