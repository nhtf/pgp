import type { User, Member, ChatRoomMember } from "$lib/entities";
import { Role } from "$lib/enums"
import { unwrap } from "$lib/Alert"
import { get, post, patch, remove } from "$lib/Web"
import { goto } from "$app/navigation";
import Swal from "sweetalert2"

type Info = { user: User, member?: Member, friendIds: number[], blockedIds: number[], my_role?: Role };
type Args = { user: User, member?: Member };
type Action = {
	condition?: (context: Info) => boolean;
	fun: (args: Args) => void;
	minRole?: Role;
};

export const actions: Action[] = [
	{ fun: befriend, condition: ({ user, friendIds }) => !friendIds.includes(user.id) },
	{ fun: unfriend, condition: ({ user, friendIds }) => friendIds.includes(user.id) },
	{ fun: block, condition: ({ user, blockedIds }) => !blockedIds.includes(user.id) },
	{ fun: unblock, condition: ({ user, blockedIds }) => blockedIds.includes(user.id) },
	{ fun: spectate, condition: ({ user}) => user.activeRoomId !== null },

	{ fun: promote, condition: ({ member, my_role }) => member && my_role ? my_role === Role.OWNER : false },
	{ fun: demote, condition: ({ member, my_role }) => member && my_role ? my_role > member.role && member.role > 0 : false },
	{ fun: kick, condition: ({ member, my_role }) => member && my_role ? my_role > member.role : false },
	{ fun: ban, condition: ({ member, my_role }) => member && my_role ? my_role > member.role : false },
	{ fun: mute, condition: ({ member, my_role }) => member && my_role ? my_role > member.role && !(member as ChatRoomMember).is_muted : false },
	{ fun: unmute, condition: ({ member, my_role }) => member && my_role ? my_role > member.role && (member as ChatRoomMember).is_muted : false },
];

async function befriend({ user }: Args) {
	await unwrap(post(`/user/me/friends`, { username: user.username }));
}

async function unfriend({ user }: Args) {
	await unwrap(remove(`/user/me/friends/${user.id}`));
}

async function block({ user }: Args) {
	await unwrap(post(`/user/me/blocked`, { id: user.id }));
}

async function unblock({ user }: Args) {
	await unwrap(remove(`/user/me/blocked`, { id: user.id }));
}

async function spectate({ user }: Args) {
	const id = user.activeRoomId;

	try {
		await get(`/game/id/${id}/self`);
	} catch (_) {
		await unwrap(post(`/game/id/${id}/members`));
	}

	await patch(`/game/id/${id}/team/me`, { team: null });
	await goto(`/game/${id}`);
}

async function promote({ member }: Args) {
	await unwrap(patch(`/chat/id/${member!.roomId}/members/${member!.id}`, { role: member!.role + 1 }));
}

async function demote({ member }: Args) {
	await unwrap(patch(`/chat/id/${member!.roomId}/members/${member!.id}`, { role: member!.role + 1 }));
}

async function kick({ member }: Args) {
	await unwrap(remove(`/chat/id/${member!.roomId}/members/${member!.id}`));
}

async function ban({ member }: Args) {
	await unwrap(remove(`/chat/id/${member!.roomId}/members/${member!.id}`, { ban: true }));
}

async function mute({ member }: Args) {
	const inputValue = 5;

	const { isConfirmed, value } = await Swal.fire({
		confirmButtonText: "Mute",
		footer: "minutes",
		input: "number",
		inputValue,
		text: "mute duration",
		showCancelButton: true,
	});

	if (isConfirmed) {
		const duration = Number(value) * 60 * 1000;

		console.log(duration);
	
		await unwrap(post(`/chat/id/${member!.roomId}/mute/${member!.id}`, { duration }));
	}
}

async function unmute({ member }: Args) {
	await unwrap(post(`/chat/id/${member!.roomId}/mute/${member!.id}`, { duration: 0 }));
}