
export type user = { username: string; friend: boolean; avatar: string };

let profile_image = "https://www.w3schools.com/howto/img_avatar.png";

export async function getOnlineUsers(): Promise<user[]> {
    let users: user[] = [
        { username: "dummy1", friend: false, avatar: profile_image },
        { username: "dummy2", friend: false, avatar: profile_image },
        { username: "dummy3", friend: false, avatar: profile_image },
        { username: "dummy4", friend: false, avatar: profile_image },
        { username: "dummy5", friend: false, avatar: profile_image },
        { username: "dummy6", friend: false, avatar: profile_image },
        { username: "dummy7", friend: false, avatar: profile_image },
        { username: "dummy8", friend: false, avatar: profile_image },
        { username: "dummy9", friend: false, avatar: profile_image },
        { username: "dummy10", friend: false, avatar: profile_image },
        { username: "dummy11", friend: false, avatar: profile_image },
        { username: "dummy12", friend: false, avatar: profile_image }
    ];
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
            let newUser: user = { username: value.username, friend: value.friend, avatar: value.avatar };
            users.push(newUser);
        });
    }
    users.sort((a, b) => {
        return (a.friend === b.friend) ? 0 : a ? 1 : -1;
    });
    return users;
}

export async function invitePlayer(username: string) {
    console.log("invite sent to ", username);
    const response = await fetch(`http://localhost:3000/game/inviteUser?username=${username}`, {
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    });
    const is_invite_accepted:boolean = await response.json();
    console.log("response:", is_invite_accepted);
    if (is_invite_accepted) {
        window.location.href="/vrtest";
    }
}

//TODO make this actually get the friends
export async function getFriends(): Promise<user[]> {
    let friends: user[] = [
        { username: "dummy1", friend: true, avatar: profile_image },
        { username: "dummy2", friend: true, avatar: profile_image },
        { username: "dummy3", friend: true, avatar: profile_image },
        { username: "dummy4", friend: true, avatar: profile_image },
        { username: "dummy5", friend: true, avatar: profile_image },
        { username: "dummy6", friend: true, avatar: profile_image },
        { username: "dummy7", friend: true, avatar: profile_image },
        { username: "dummy8", friend: true, avatar: profile_image },
        { username: "dummy9", friend: true, avatar: profile_image },
        { username: "dummy10", friend: true, avatar: profile_image },
        { username: "dummy11", friend: true, avatar: profile_image },
        { username: "dummy12", friend: true, avatar: profile_image }
    ];
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
            let newUser: user = { username: value.username, friend: value.friend, avatar: value.avatar };
            friends.push(newUser);
        });
    }
    friends.sort((a, b) => {
        return (a.friend === b.friend) ? 0 : a ? 1 : -1;
    });
    return friends;
}