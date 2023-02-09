
import type { Invite } from "./types";
import {post, remove} from "./Web";
import { BACKEND } from "$lib/constants";
import { invalidate } from "$app/navigation";

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
        if (action === "deny") {
            console.log("trying to remove a friend request from here: ", invite.id);
            await remove(`/user/me/friends/requests/${invite.id}`);
        }
        else
            await post(`/user/me/friends/requests/`, {"id": invite.from.id}); 
    }

    //TODO this one probably not needed anymore
    await invalidate(`${BACKEND}/user/me/invites`); //TODO thanks chen en daan for this stupid function that makes it properly update a component when it's data changes
}