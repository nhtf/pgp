import { error } from '@sveltejs/kit';
import type { PageLoad } from "./$types"
import type {User, Achievment} from "$lib/types"
import { get, remove } from '$lib/Web';

export const ssr = false;

let profile_image = "https://www.w3schools.com/howto/img_avatar.png";

type simpleuser = {id: number; username: string; avatar: string; online: boolean; in_game: boolean;}

let friends: simpleuser[] | null = [
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

const test = "/Assets/icons/pen.png"

let dummyachievments: Achievment[] = [
	{name: "first game", icon: test, have: true, text: "started a gane", level: 0},
	{name: "won a game", icon: test, have: true, text: "started a gane", level: 0},
	{name: "lost a game", icon: test, have: true, text: "started a gane", level: 0},
	{name: "played 10 games", icon: test, have: true, text: "started a gane", level: 0},
	{name: "won 10 games", icon: test, have: true, text: "started a gane", level: 0},
	{name: "made your first friend", icon: test, have: true, text: "started a gane", level: 0},
	{name: "made 10 friends", icon: test, have: true, text: "started a gane", level: 0},
	{name: "sent first chat message", icon: test, have: true, text: "started a gane", level: 0},
	{name: "make a chat room", icon: test, have: true, text: "started a gane", level: 0},
	{name: "invited a player to a game", icon: test, have: true, text: "started a gane", level: 0},
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
	const user = await get(fetch, `/user/${params.username}`);
	if (!user.id) {
		throw error(404, "username not found");
	}

	let can_unfriend = false;
	//just for debug
	if (!user.achievment) {
	user.achievments = dummyachievments}
	if (user.username === params.username)
		can_unfriend = true;
	let options = dummyoptionscreater(can_unfriend, user.username);

	//getting friends
	console.log("hey");
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
				friends?.push(newUser);
				options.set(user.username, 
					{
						title: user.username,
						data: [
						{text: "view profile", fn: null, show: true, redir: "/profile/" + user.username},
						{text: "spectate", fn: null, show: user.in_game, redir: null}, 
						{text: "invite game", fn: null, show: user.online && !user.in_game, redir: null}, 
						{text: "unfriend", fn: null, show: true, redir: null}
					]});
				
			});
		}
	}
	catch (err:any) {friends = null;}
	return { fetch, user, friends, options };
}) satisfies PageLoad;
