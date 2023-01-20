import { error } from '@sveltejs/kit';
import type { PageLoad } from "./$types"
import type { User, Achievement } from "$lib/types"
import { get, remove } from '$lib/Web';

export const ssr = false;

let profile_image = "https://www.w3schools.com/howto/img_avatar.png";

type simpleuser = {id: number; username: string; avatar: string; online: boolean; in_game: boolean;}

const friends: simpleuser[] = [
	{ username: "dummy1", avatar: profile_image, online: true, in_game: false, id: 0 },
	{ username: "dummy2", avatar: profile_image, online: true, in_game: false, id: 0 },
	{ username: "dummy3", avatar: profile_image, online: true, in_game: false, id: 0 },
	{ username: "dummy4", avatar: profile_image, online: true, in_game: false, id: 0 },
	{ username: "dummy5", avatar: profile_image, online: true, in_game: false, id: 0 },
	{ username: "dummy6", avatar: profile_image, online: true, in_game: false, id: 0 },
	{ username: "dummy7", avatar: profile_image, online: true, in_game: true, id: 2 },
	{ username: "dummy8", avatar: profile_image, online: true, in_game: false, id: 0 },
	{ username: "dummy9", avatar: profile_image, online: true, in_game: false, id: 0},
	{ username: "dummy10", avatar: profile_image, online: false, in_game: false, id: 0},
	{ username: "dummy11", avatar: profile_image, online: false, in_game: false, id: 0},
	{ username: "dummy12", avatar: profile_image, online: false, in_game: true, id: 0 }
];

const test = "/Assets/achievement-icons/pong.svg"

let dummyachievements: Achievement[] = [
	{name: "Loser", icon: test, have: true, text: ["lost a game", "lose 5 games", "lose 10 games", "lose 15 games"], level: 0, progress: 1, level_cost: [5, 10, 15]},
	{name: "Gamer", icon: test, have: true, text: ["played a game", "played 5 games", "played 10 games", "played 15 games"], level: 2, progress: 11, level_cost: [5, 10, 15]},
	{name: "Winner", icon: test, have: true, text: ["won a game", "won 5 games", "won 10 games", "won 15 games"], level: 2, progress: 10, level_cost: [5, 10, 15]},
	{name: "Popular", icon: test, have: true, text: ["made a friend", "made 5 friend", "made 10 friend", "made 15 friend"], level: 2, progress: 11, level_cost: [5, 10, 15]},
	{name: "Chatty", icon: test, have: true, text: ["sent a message", "sent 5 message", "sent 10 message", "sent 15 message"], level: 0, progress: 1, level_cost: [5, 10, 15]},
	{name: "Social", icon: test, have: true, text: ["joined a chatroom", "joined 5 chatroom", "joined 10 chatroom", "joined 15 chatroom"], level: 3, progress: 15, level_cost: [5, 10, 15]},
	{name: "silver medal test", icon: test, have: true, text: ["requirement 0", "requirement 1", "requirement 2", "requirement 3"], level: 1, progress: 6, level_cost: [5, 10, 15]},
];

function dummyoptionscreater(can_unfriend: boolean, username: string) {
	let options = new Map();

	//debug stuff
	friends?.forEach((user) => {
		let fn: any = null;
		if (can_unfriend) {
			fn = async () => {
				const response = await remove(fetch, `/user/${username}/friends/${user.username}`);
				return response;
			};
		}
		options.set(user.username, 
			{
				title: user.username,
				data: [
				{text: "view profile", fn: null, show: true, redir: "/profile/" + user.username},
				{text: "spectate", fn: null, show: user.in_game, redir: null}, 
				{text: "invite game", fn: null, show: user.online && !user.in_game, redir: null}, 
				{text: "unfriend", fn: fn, show: true, redir: null}
			]});
	})
	return options;
}


export const load: PageLoad = (async ({ fetch, params }) => {
	console.log("load: /profile/[username]");
	try {
		const profile: User = await get(fetch, `/user/${params.username}`);
		const user: User = await get(fetch, `/user/me`);
		let can_unfriend = false;
		//just for debug
		if (!profile.achievements) {
			profile.achievements = dummyachievements}
		if (profile.username === params.username)
			can_unfriend = true;
		let options = dummyoptionscreater(can_unfriend, profile.username);

		let dummy_friends: simpleuser[] | null  = friends;
		//getting friends
		try {
			let friend_list: User[] = await get(fetch, `/user/${params.username}/friends`);
			if (friend_list !== undefined) {
				friend_list.forEach((value) => {
					let newUser: simpleuser = { 
						username: value.username, 
						avatar: value.avatar, 
						online: value.online, 
						in_game: false, 
						id: value.id };
					dummy_friends?.push(newUser);
					options.set(newUser.username, 
						{
							title: newUser.username,
							data: [
							{text: "view profile", fn: null, show: true, redir: "/profile/" + newUser.username},
							{text: "spectate", fn: null, show: user.in_game, redir: null}, 
							{text: "invite game", fn: null, show: user.online && !newUser.in_game, redir: null}, 
							{text: "unfriend", fn: null, show: true, redir: null}
						]});
					
				});
			}
		}
		catch (err:any) {
			console.log("error gettting friends: ", err);
			dummy_friends = null;
		}
		const friendlist = dummy_friends;
		console.log("load return: ", { fetch, user, friendlist, options, profile });
		return { fetch, user, friendlist, options, profile };
	}
	catch (err: any) {
		console.log("error in /profile/[username] load: ", err);
		if (err.status === 403) {
			throw error(403, "You need to be logged in to view profiles");
		}
		if (err.status === 404) {
			throw error(404, "user not found");
		}
		console.log("throw?");
	}
}) satisfies PageLoad;
