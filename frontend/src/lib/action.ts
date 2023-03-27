import type { User, Member } from "$lib/entities";
import type { Role } from "$lib/enums"
import { unwrap } from "$lib/Alert"
import { get, post, patch, remove } from "$lib/Web"
import { goto } from "$app/navigation";
import Swal from "sweetalert2"

type Action = {
	condition?: (user: User, member?: Member, ...args: any[]) => boolean;
	fun: (user: User, member?: Member) => void;
	minRole?: Role;
};

export const actions: Action[] = [
	{ fun: befriend, condition: (user: User, member?: Member, ...args: any[]) => !args[0].includes(user.id) },
	{ fun: unfriend, condition: (user: User, member?: Member, ...args: any[]) => args[0].includes(user.id) },
	{ fun: block, condition: (user: User, member?: Member, ...args: any[]) => !args[0].includes(user.id) },
	{ fun: unblock, condition: (user: User, member?: Member, ...args: any[]) => args[0].includes(user.id) },
	{ fun: spectate, condition: (user: User, member?: Member, ...args: any[]) => user.activeRoomId !== null },
];

async function befriend(user: User) {
	await unwrap(post(`/user/me/friends/request`, { username: user.username }));
	await Swal.fire({ icon: "success", timer: 1000, showConfirmButton: false });
}

async function unfriend(user: User) {
	await unwrap(remove(`/user/me/friends/${user.id}`));
	await Swal.fire({ icon: "success", timer: 1000, showConfirmButton: false });
}

async function block(user: User) {
	await unwrap(post(`/user/me/blocked`, { id: user.id }));
}

async function unblock(user: User) {
	await unwrap(remove(`/user/me/blocked`, { id: user.id }));
}

async function spectate(user: User) {
	const id = user.activeRoomId;

	try {
		await get(`/game/id/${id}/self`);
	} catch (_) {
		await unwrap(post(`/game/id/${id}/members`));
	}

	await patch(`/game/id/${id}/team/me`, { team: null });
	await goto(`/game/${id}`);
}
