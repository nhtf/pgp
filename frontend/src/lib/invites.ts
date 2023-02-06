
import type { Invite } from "./types";
import {post, remove} from "./Web";
import { BACKEND } from "$lib/constants";
import { invalidate } from "$app/navigation";

//TODO fix that if you remove a invite and then without refreshing the page make the same invite again it shows 2 invites now
export async function respond(invite: Invite, action: string) {
    if (invite.type === "ChatRoom" || invite.type === "GameRoom") {
        if (action === "deny") {
            await remove(`/room/id/${invite.room?.id}/invite/${invite.id}`);
        }
        else {
            await post(`/room/id/${invite.room?.id}/members`);
            console.log("did a post here");
        }
    }
    else if (invite.type === "Friend") {
        if (action === "deny")
            await remove(`/user/me/friends/requests/${invite.id}`);
        else
            await post(`/user/me/friends/requests/`, {"id": invite.from.id}); 
    }
    await invalidate(`${BACKEND}/user/me/invites`); //TODO thanks chen en daan for this stupid function that makes it properly update a component when it's data changes
}