import type { PageLoad } from "./$types"
import { User, ChatRoom, Member, Entity} from "$lib/entities";
import { userStore, roomStore, memberStore, updateStore  } from "$lib/stores";
import { Role } from "$lib/enums"
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";
import { error } from "@sveltejs/kit";

export const load: PageLoad = (async ({ parent, fetch, params }) => {
	window.fetch = fetch;

	const { user } = await unwrap(parent());
	const room: ChatRoom = await unwrap(get(`/chat/${params.id}`));
	const members: Member[] = await unwrap(get(`/chat/${params.id}/members`));
	const banned: User[] = await unwrap(get(`/chat/${params.id}/bans`));

	const member: Member = members.find((member) => member.userId === user!.id)!;

	if (member.role < Role.ADMIN) {
		throw error(401, "Must be admin or owner");
	}

	updateStore(roomStore, room, ChatRoom);
	updateStore(userStore, banned, Entity);
	updateStore(memberStore, members, Member);

    return { room, member, members, banned };
}) satisfies PageLoad;
