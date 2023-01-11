
import { error } from '@sveltejs/kit';

export const ssr = false;

type user = { username: string; avatar: string; online: boolean; in_game: boolean };

let profile_image = "https://www.w3schools.com/howto/img_avatar.png";

let friends: user[] = [
	{ username: "dummy1", avatar: profile_image, online: true, in_game: false },
	{ username: "dummy2", avatar: profile_image, online: true, in_game: false },
	{ username: "dummy3", avatar: profile_image, online: true, in_game: false },
	{ username: "dummy4", avatar: profile_image, online: true, in_game: false },
	{ username: "dummy5", avatar: profile_image, online: true, in_game: false },
	{ username: "dummy6", avatar: profile_image, online: true, in_game: false },
	{ username: "dummy7", avatar: profile_image, online: true, in_game: true },
	{ username: "dummy8", avatar: profile_image, online: true, in_game: false },
	{ username: "dummy9", avatar: profile_image, online: true, in_game: false },
	{ username: "dummy10", avatar: profile_image, online: false, in_game: false },
	{ username: "dummy11", avatar: profile_image, online: false, in_game: false },
	{ username: "dummy12", avatar: profile_image, online: false, in_game: true }
];

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }: any) {

	//getting userstuff
	const res = await fetch(`http://localhost:3000/account/whois?username=${params.username}`, {
		method: "GET",
		credentials: "include",
		mode: "cors",
	});
	const user = await res.json();
	if (!user.user_id) {
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
			let newUser: user = { username: value.username, avatar: value.avatar, online: value.online, in_game: false };
			friends.push(newUser);
		});
	}

	return { user, friends, fetch };
};
