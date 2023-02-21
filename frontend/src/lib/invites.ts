import type { Invite } from "./entities";
import { post, remove } from "./Web";

export async function respond(invite: Invite, action: "accept" | "deny") {
	switch (invite.type) {
		case "ChatRoom":
		case "GameRoom":
			const url_type = invite.type.replace("Room", "").toLowerCase();
		
			if (action === "deny") {
				await remove(`/${url_type}/id/${invite.room?.id}/invite/${invite.id}`);
			} else {
				await post(`/${url_type}/id/${invite.room?.id}/members`);
			}
			break;
		case "Friend":
			if (action === "deny") {
				await remove(`/user/me/friends/requests/${invite.id}`);
			} else {
				await post(`/user/me/friends/requests/`, { id: invite.from.id });
			}
			break;
	}

	//TODO this one probably not needed anymore
	// await invalidate(`${BACKEND}/user/me/invites`); //TODO thanks chen en daan for this stupid function that makes it properly update a component when it's data changes
}