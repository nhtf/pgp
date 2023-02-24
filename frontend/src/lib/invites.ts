import type { Invite } from "./entities";
import { post, remove } from "./Web";

export async function respond(invite: Invite, action: "accept" | "deny") {
	switch (invite.type) {
		case "ChatRoom":
		case "GameRoom":
			const route = invite.type.replace("Room", "").toLowerCase();
		
			if (action === "accept") {
				await post(`/${route}/id/${invite.room?.id}/members`);
			} else {
				await remove(`/${route}/id/${invite.room?.id}/invite/${invite.id}`);
			}
			break;
		case "Friend":
			if (action === "accept") {
				await post(`/user/me/friends/requests/`, { id: invite.from.id });
			} else {
				await remove(`/user/me/friends/requests/${invite.id}`);
			}
			break;
	}
}