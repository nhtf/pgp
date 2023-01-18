
import { error } from '@sveltejs/kit';
import type { PageLoad } from "./$types"

export const ssr = false;

async function unfriend(username: string, index: number) {
	const response = await fetch(`http://localhost:3000/account/unfriend?username=${username}`, {
		method: "POST",
		credentials: "include",
		mode: "cors",
	});
	if (response.ok) {
		console.log("unfriend succesful.\n");
		friends.splice(index, 1);
		friends = friends;
	}
}

type user = { username: string; avatar: string; online: boolean; in_game: boolean; id: number };

let profile_image = "https://www.w3schools.com/howto/img_avatar.png";

let friends: user[] = [
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

export const load: PageLoad = (async ({ fetch, params }: any) => {

	let options = new Map();

	//debug stuff
	friends.forEach((user) => {
		options.set(user.username, 
			{
				title: user.username,
				data: [
				{text: "view profile", fn: null, show: true, redir: "/profile/" + user.username},
				{text: "spectate", fn: null, show: user.in_game, redir: null}, 
				{text: "invite game", fn: null, show: user.online && !user.in_game, redir: null}, 
				{text: "unfriend", fn: unfriend, show: true, redir: null}
			]});
	})
	//getting userstuff
	const res = await fetch(`http://localhost:3000/user/${params.username}`, {
		method: "GET",
		credentials: "include",
		mode: "cors",
	});
	const user = await res.json();
	if (!user.id) {
		throw error(404, "username not found");
	}

	//getting friends
	const friend_list = await fetch("http://localhost:3000/account/friends", {
		method: "GET",
		credentials: "include",
		mode: "cors",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});
	const friend_list_json = await friend_list.json();
	if (friend_list_json !== undefined) {
		friend_list_json.forEach((value: any) => {
			let newUser: user = { username: value.username, avatar: value.avatar, online: value.online, in_game: false, id: value.id };
			friends.push(newUser);
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
	// const response = await doFetch(fetch, "/room/invites/to", { credentials: "include" });

	// if (!response.ok) {
	// 	throw error(response.code, response.message);
	// }

	// const invites = response.result;

	return { fetch, user, friends, options };
}) satisfies PageLoad;
