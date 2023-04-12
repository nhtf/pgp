import { BACKEND } from "$lib/constants";
import type { PageLoad } from "./$types";
import { get } from '$lib/Web';

export const ssr = false;

export const load: PageLoad = (async ({ fetch }) => {
    window.fetch = fetch;

    // const leaderBoard = await get('/Leaderboard');
    const leaderBoardClassic = await get('/Leaderboard', {gamemode: 0, sort: "ASC"});
    const leaderBoardVR = await get('/Leaderboard', {gamemode: 1, sort: "ASC"});
    const leaderBoardModern = await get('/Leaderboard', {gamemode: 2, sort: "ASC", team_count: 2});
    const leaderBoardModern4p = await get('/Leaderboard', {gamemode: 2, sort: "ASC", team_count: 4});
    // const leaderBoardModern4p = await get('/Leaderboard?gamemode=3');
    console.log("leaderboardclass: ", leaderBoardClassic);
    console.log("leaderboardvr: ", leaderBoardVR);
    console.log("leaderboardmodern: ", leaderBoardModern);
    // console.log("leaderboard m4p: ", leaderBoardModern4p);
    return { lb: [
        {id: "classic", data: leaderBoardClassic},
        {id: "vr", data: leaderBoardVR},
        {id: "modern", data: leaderBoardModern},
        {id: "modern4p", data: leaderBoardModern4p},
    ] };
}) satisfies PageLoad;