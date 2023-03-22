import type { Invite } from "./entities";
import { post, remove } from "./Web";

export async function respond(invite: Invite, action: "accept" | "deny") {
	console.log(invite.type);
	switch (invite.type) {
		case "Friend":
			if (action === "accept") {
				await post(`/user/me/friends/requests/`, { username: invite.from.username });
			} else {
				await remove(`/user/me/friends/requests/${invite.id}`);
			}
			break;
		case "ChatRoom":
		case "GameRoom":
			const route = invite.type.replace("Room", "").toLowerCase();
		
			if (action === "accept") {
				await post(`/${route}/id/${invite.room?.id}/members`, { id: null });
			} else {
				await remove(`/${route}/id/${invite.room?.id}/invite/${invite.id}`);
			}
			break;
		// TODO: remove
		default:
			if (action === "accept") {
				await post(`/user/me/friends/requests/`, { username: invite.from.username });
			} else {
				await remove(`/user/me/friends/requests/${invite.id}`);
			}
	}
}