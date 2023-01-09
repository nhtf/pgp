
export type user = { username: string; friend: boolean; avatar: string; online: boolean; in_game: boolean };

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