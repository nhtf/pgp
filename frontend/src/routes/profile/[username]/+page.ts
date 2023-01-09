
import { error } from '@sveltejs/kit';

//TODO fix this so it properly gets the friends and online users

export const ssr = false;

type user = { username: string; friend: boolean; avatar: string; online: boolean; in_game: boolean };

let profile_image = "https://www.w3schools.com/howto/img_avatar.png";
let online_users: user[] = [
	{ username: "dummy1", friend: false, avatar: profile_image, online: true, in_game: false },
	{ username: "dummy2", friend: false, avatar: profile_image, online: true, in_game: false },
	{ username: "dummy3", friend: false, avatar: profile_image, online: true, in_game: false },
	{ username: "dummy4", friend: false, avatar: profile_image, online: true, in_game: false },
	{ username: "dummy5", friend: false, avatar: profile_image, online: true, in_game: false },
	{ username: "dummy6", friend: false, avatar: profile_image, online: true, in_game: false },
	{ username: "dummy7", friend: false, avatar: profile_image, online: true, in_game: false },
	{ username: "dummy8", friend: false, avatar: profile_image, online: true, in_game: false },
	{ username: "dummy9", friend: false, avatar: profile_image, online: true, in_game: false },
	{ username: "dummy10", friend: false, avatar: profile_image, online: true, in_game: false },
	{ username: "dummy11", friend: false, avatar: profile_image, online: true, in_game: false },
	{ username: "dummy12", friend: false, avatar: profile_image, online: true, in_game: false }
];

let friends: user[] = [
	{ username: "dummy1", friend: true, avatar: profile_image, online: true,in_game:false },
	{ username: "dummy2", friend: true, avatar: profile_image, online: true,in_game:false },
	{ username: "dummy3", friend: true, avatar: profile_image, online: true,in_game:false },
	{ username: "dummy4", friend: true, avatar: profile_image, online: true,in_game:false },
	{ username: "dummy5", friend: true, avatar: profile_image, online: true,in_game:false },
	{ username: "dummy6", friend: true, avatar: profile_image, online: true,in_game:false },
	{ username: "dummy7", friend: true, avatar: profile_image, online: true,in_game:true },
	{ username: "dummy8", friend: true, avatar: profile_image, online: true,in_game:false },
	{ username: "dummy9", friend: true, avatar: profile_image, online: true,in_game:false },
	{ username: "dummy10", friend: true, avatar: profile_image, online: false, in_game: false },
	{ username: "dummy11", friend: true, avatar: profile_image, online: false, in_game: false },
	{ username: "dummy12", friend: true, avatar: profile_image, online: false, in_game: true }
];


/** @type {import('./$types').PageLoad} */
export async function load({fetch, params}) {

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

	//getting online users
	const onlineUsersRequest = await fetch("http://localhost:3000/game/onlineUsers", {
        method: "GET",
        credentials: "include",
        mode: "cors",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    const onlineUsers = await onlineUsersRequest.json();
    if (onlineUsers !== undefined) {
        onlineUsers.forEach((value: any) => {
            let newUser: user = { username: value.username, friend: value.friend, avatar: value.avatar, online: value.online, in_game: false };
            online_users.push(newUser);
        });
    }
    online_users.sort((a, b) => {
        return (a.friend === b.friend) ? 0 : a ? 1 : -1;
    });

	//getting friends
	const friendUserRequest = await fetch("http://localhost:3000/game/onlineUsers", {
        method: "GET",
        credentials: "include",
        mode: "cors",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    const friendusers = await friendUserRequest.json();
    if (friendusers !== undefined) {
        friendusers.forEach((value: any) => {
            let newUser: user = { username: value.username, friend: value.friend, avatar: value.avatar, online: value.online, in_game: false };
            friends.push(newUser);
        });
    }
    friends.sort((a, b) => {
        return (a.friend === b.friend) ? 0 : a ? 1 : -1;
    });

    return {user, online_users, friends};
  }

