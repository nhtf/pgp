import type { Invite } from "./entities";
import { post, remove } from "./Web";

export async function respond(invite: Invite, action: "accept" | "deny") {
	switch (invite.type) {
		case "ChatRoom":
		case "GameRoom":
			const room = invite.room!;
		
			if (action === "accept") {
				await post(`${room.route}/members`);
			} else {
				await remove(`${room.route}/invite/${invite.id}`);
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