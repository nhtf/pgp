import { error } from '@sveltejs/kit';
import type { PageLoad } from "./$types"
import type { User, Achievement, Invite } from "$lib/types"
import { get, remove } from '$lib/Web';
import { unwrap } from '$lib/Alert';
import { BACKEND_ADDRESS } from '$lib/constants';
import { io } from 'socket.io-client';
import { readable, writable } from 'svelte/store';

export const ssr = false;

let profile_image = "https://www.w3schools.com/howto/img_avatar.png";

export type simpleuser = {id: number; username: string; avatar: string; status: string; in_game: boolean;}

const friends: simpleuser[] = [
	{ username: "dummy1", avatar: profile_image, status: "online", in_game: false, id: 0 },
	{ username: "dummy2", avatar: profile_image, status: "online", in_game: false, id: 0 },
	{ username: "dummy3", avatar: profile_image, status: "online", in_game: false, id: 0 },
	{ username: "dummy4", avatar: profile_image, status: "online", in_game: false, id: 0 },
	{ username: "dummy5", avatar: profile_image, status: "online", in_game: false, id: 0 },
	{ username: "dummy6", avatar: profile_image, status: "online", in_game: false, id: 0 },
	{ username: "dummy7", avatar: profile_image, status: "online", in_game: true, id: 0 },
	{ username: "dummy8", avatar: profile_image, status: "online", in_game: false, id: 0 },
	{ username: "dummy9", avatar: profile_image, status: "online", in_game: false, id: 0},
	{ username: "dummy10", avatar: profile_image, status: "offline", in_game: false, id: 0},
	{ username: "dummy11", avatar: profile_image, status: "offline", in_game: false, id: 0},
	{ username: "dummy12", avatar: profile_image, status: "offline", in_game: true, id: 0 }
];

const pong = "/Assets/achievement-icons/pong.svg";
const gamer = "/Assets/achievement-icons/gamer.svg";
const chat = "/Assets/achievement-icons/chat.svg";
const winner = "/Assets/achievement-icons/winner.svg";
const popular = "/Assets/achievement-icons/popular.svg";
const chatroom = "/Assets/achievement-icons/chatroom.svg";
const vrpong = "/Assets/achievement-icons/vrpong.svg";
const classic = "/Assets/achievement-icons/classic.svg";

let dummyachievements: Achievement[] = [
	{name: "Loser", icon: pong, have: true, text: ["you lost the game", "lose 5 games", "lose 10 games", "lose 15 games"], level: 0, progress: 1, level_cost: [5, 10, 15]},
	{name: "Gamer", icon: gamer, have: true, text: ["played a game", "played 5 games", "played 10 games", "played 15 games"], level: 2, progress: 11, level_cost: [5, 10, 15]},
	{name: "Winner", icon: winner, have: true, text: ["won a game", "won 5 games", "won 10 games", "won 15 games"], level: 2, progress: 10, level_cost: [5, 10, 15]},
	{name: "Popular", icon: popular, have: true, text: ["made a friend", "made 5 friend", "made 10 friend", "made 15 friend"], level: 2, progress: 11, level_cost: [5, 10, 15]},
	{name: "Chatty", icon: chat, have: true, text: ["sent a message", "sent 5 message", "sent 10 message", "sent 15 message"], level: 0, progress: 1, level_cost: [5, 10, 15]},
	{name: "Social", icon: chatroom, have: true, text: ["joined a chatroom", "joined 5 chatroom", "joined 10 chatroom", "joined 15 chatroom"], level: 3, progress: 15, level_cost: [5, 10, 15]},
	{name: "VR Pong", icon: vrpong, have: true, text: ["played your first VR pong game", "played 5 VR pong games", "played 10 VR pong games", "played 15 VR pong games"], level: 1, progress: 6, level_cost: [5, 10, 15]},
	{name: "Classic Pong", icon: classic, have: true, text: ["played classic pong for the first time", "played 5 classic pong games", "played 10 classic pong games", "played 15 classic pong games"], level: 1, progress: 6, level_cost: [5, 10, 15]},
];

function dummydropcreater(can_unfriend: boolean, username: string) {
	let drop = new Map();

	//debug stuff
	friends?.forEach((user) => {
		let fn: any = null;
		if (can_unfriend) {
			fn = async () => {
				const response = await remove(`/user/${username}/friends/${user.username}`);
				return response;
			};
		}
		drop.set(user.username, 
			{
				title: user.username,
				options: {
				data: [
				{text: "view profile", fn: null, show: true, redir: "/profile/" + user.username},
				{text: "spectate", fn: null, show: user.in_game, redir: null}, 
				{text: "invite game", fn: null, show: user.status !== "offline" && !user.in_game, redir: null}, 
				{text: "unfriend", fn: fn, show: true, redir: null}
				]},
			});
	})
	return drop;
}

async function getFriendList(username: string, options: Map<any, any>) {
	let dummy_friends: simpleuser[] | null = null;
	dummy_friends = [];
	dummy_friends = dummy_friends.concat(friends);
	let friend_list: User[] = await get(`/user/me/friends`);
	if (friend_list !== undefined) {
		friend_list.forEach((value) => {
			let newUser: simpleuser = { 
				username: value.username, 
				avatar: value.avatar, 
				status: value.status, 
				in_game: false, 
				id: value.id };
			dummy_friends?.push(newUser);
			options.set(newUser.username, 
				{
					title: newUser.username,
					options: {
					data: [
					{text: "view profile", fn: null, show: true, redir: "/profile/" + newUser.username},
					{text: "spectate", fn: null, show: newUser.in_game, redir: null}, 
					{text: "invite game", fn: null, show: newUser.status !== "offline" && !newUser.in_game, redir: null}, 
					{text: "unfriend", fn: null, show: true, redir: null}
				]}});
			
		});
	}
	return dummy_friends;
}


export const load: PageLoad = (async ({ fetch, params }) => {
	console.log("load: /profile/[username]");
	try {
		const profile: User = await get(`/user/${params.username}`);
		const user: User = await get(`/user/me`);
		let can_unfriend = false;
		//just for debug
		if (!profile.achievements) {
			profile.achievements = dummyachievements}
		if (profile.username === params.username)
			can_unfriend = true;
		let drop = dummydropcreater(can_unfriend, profile.username);

		let dummy_friends: simpleuser[] | null = null;
		
		if (user.username === profile.username) {
			//getting friends
			try {
				
				let friendlist = await getFriendList(user.username, drop);
				let socket = io(`ws://${BACKEND_ADDRESS}/update`, {withCredentials: true});
				socket.on("update", async (status) => {
					friendlist.forEach((friend: simpleuser) => {
						if (friend.id === status.id)
							friend.status = status.status;
					});
					friendlist = friendlist;
				});
				
				console.log("load return: ", { fetch, user, friendlist, drop, profile });
				return { fetch, user, friendlist, drop, profile };
			}
			catch (err:any) {
				console.log("error gettting friends: ", err);
			}
		}
		const friendlist = dummy_friends;
		console.log("load return: ", { fetch, user, friendlist, drop, profile });
		return { fetch, user, friendlist, drop, profile };
	}
	catch (err: any) {
		console.log("error in /profile/[username] load: ", err);
		const message = err.message.substr(9);
		throw error(err.status, message);
	}
}) satisfies PageLoad;
