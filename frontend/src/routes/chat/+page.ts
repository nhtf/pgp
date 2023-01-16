import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types"

export type User = {
	user_id: number,
	username: string,
	avatar: string
};

export type Message = {
	content: string,
	user: User,
};

export type Room = {
    id: number,
    name: string,
    owner: User,
    admins: User[],
    members: User[],
    invites: any[],
    messages: Message[],
}

export const load = (async ({ fetch }: any) => {
    const URL = "http://localhost:3000/chat/rooms";
    const response = await fetch(URL, {
        credentials: "include",
    });

    if (!response.ok) {
        throw redirect(307, "/profile");
    }

    const rooms = await response.json();

    return { fetch, rooms };
}) satisfies PageLoad

