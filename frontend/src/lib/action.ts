import type { Member, ChatRoomMember, Room, User } from "$lib/entities";
import { Gamemode, Role, Status } from "$lib/enums"
import { post, patch, remove } from "$lib/Web"
import { goto } from "$app/navigation";
import { unwrap } from "$lib/Alert"
import { GameRoom } from "$lib/entities"
import Swal from "sweetalert2"

type Info = { user: User, member?: Member, room?: Room, friendIds: number[], blockedIds: number[], my_role?: Role, banned: boolean };
type Args = { user: User, member?: Member, room?: Room };
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
	{ fun: invite, condition: ({ user }) => user.status !== Status.INGAME && user.status !== Status.OFFLINE },
	{ fun: spectate, condition: ({ user }) => user.status === Status.INGAME },
	{ fun: unban, condition: ({ banned }) => banned },

	{ fun: promote, condition: ({ member, my_role }) => member && my_role ? my_role === Role.OWNER : false },
	{ fun: demote, condition: ({ member, my_role }) => member && my_role ? my_role > member.role && member.role > 0 : false },
	{ fun: kick, condition: ({ member, my_role }) => member && my_role ? my_role > member.role : false },
	{ fun: ban, condition: ({ member, my_role }) => member && my_role ? my_role > member.role : false },
	{ fun: mute, condition: ({ member, my_role }) => member && my_role ? my_role > member.role && !(member as ChatRoomMember).is_muted : false },
	{ fun: unmute, condition: ({ member, my_role }) => member && my_role ? my_role > member.role && (member as ChatRoomMember).is_muted : false },
];

// User

async function befriend({ user }: Args) {
	await unwrap(post(`/user/me/friends`, { username: user.username }));
}

async function unfriend({ user }: Args) {
	await unwrap(remove(`/user/me/friends`, { friend: user.id }));
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
		await post(`/game/${id}/members`);
		await patch(`/game/${id}/team/me`, { team: null });
	} catch (error) {}

	await goto(`/game/${id}`);
}

async function unban({ room, user }: Args) {
	await unwrap(remove(`${room!.route}/bans/${user.id}`));
}

async function invite({ user }: Args) {
	const { isConfirmed, value } = await gamemodeSelector();

	if (!isConfirmed) {
		return ;
	}

	const gamemode = value ? Number(value) : Gamemode.CLASSIC;

	const roomDto = {
		name: null,
		password: null,
		is_private: true,
		gamemode,
		players: 2,
	};

	const info = await unwrap(post(`/game`, roomDto));
	const room = new GameRoom;

	room.id = info.id;
	room.type = info.type;

	await unwrap(patch(`/game/${room.id}/team/auto`));
	await unwrap(post(`/game/${room.id}/invite`, { username: user.username }));
	await roomPrompt(room);
}

// Member

async function promote({ member, room }: Args) {
	await unwrap(patch(`${room!.route}/members/${member!.id}`, { role: member!.role + 1 }));
}

async function demote({ member, room }: Args) {
	await unwrap(patch(`${room!.route}/members/${member!.id}`, { role: member!.role - 1 }));
}

async function kick({ member, room }: Args) {
	await unwrap(remove(`${room!.route}/members/${member!.id}`));
}

async function ban({ member, room }: Args) {
	await unwrap(remove(`${room!.route}/members/${member!.id}`, { ban: true }));
}

async function mute({ member, room }: Args) {
	const inputValue = 5;

	const { isConfirmed, value } = await Swal.fire({
		confirmButtonText: "Mute",
		footer: "minutes",
		input: "number",
		inputValue,
		text: "mute duration",
		showCancelButton: true,
		inputValidator: (value: string) => {
			if (Number(value) < 1)
				return "Duration must be positive";
			return null;
		}
	});

	if (isConfirmed) {
		const duration = Number(value) * 60 * 1000;

		await unwrap(patch(`${room!.route}/members/${member!.id}`, { mute: new Date(Date.now() + duration) }));
	}
}

async function unmute({ member, room }: Args) {
	await unwrap(patch(`${room!.route}/members/${member!.id}`, { mute: new Date() }));
}

// Util

async function gamemodeSelector() {
	const promise = Swal.fire({
		title: "Invite to match",
		input: "radio",
		inputOptions: [ "Classic", "Modern", "VR" ],
		confirmButtonText: "Invite",
		showCancelButton: true,
	});
	
	const elements = document.getElementsByName("swal2-radio") as NodeListOf<HTMLInputElement>;
	const element = [...elements].find((element) => Number(element.value) === 0)!;

	element.checked = true;

	return promise;
}

async function roomPrompt(room: Room) {
	Swal.fire({
		title: "Go to game?",
		showConfirmButton: true,
		showCancelButton: true,
		confirmButtonText: "Go",
	}).then(async (result) => {
		if (result.isConfirmed) {
			await goto(room.route);
		}
	});
}
