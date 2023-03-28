import type { Invite } from "./entities";
import { post, remove } from "./Web";

export async function respond(invite: Invite, action: "accept" | "deny") {
	switch (invite.type) {
		case "ChatRoom":
		case "GameRoom":
			const route = invite.type.replace("Room", "").toLowerCase();
		
			if (action === "accept") {
				await post(`/${route}/id/${invite.room?.id}/members`, { id: null });
			} else {
				await remove(`/${route}/id/${invite.room?.id}/invite/${invite.id}`);
			}
			break;
		case "FriendRequest":
			if (action === "accept") {
				await post(`/user/me/friends`, { username: invite.from.username });
			} else {
				await remove(`/user/me/friends/requests/${invite.id}`);
			}
			break;
	}
}