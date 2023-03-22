<script lang="ts">
	import type { GameRoomMember, User } from "$lib/entities";
	import { goto } from "$app/navigation";
	import { swal, unwrap } from "$lib/Alert";
	import { status_colors } from "$lib/constants";
	import { Gamemode, Status } from "$lib/enums";
	import { blockStore, gameStateStore, userStore } from "$lib/stores";
	import { get, patch, post, remove } from "$lib/Web";
	import { Avatar, Button, Dropdown, DropdownItem } from "flowbite-svelte";
    import Match from "./Match.svelte";

	export let user: User;

	const items = [
		{ condition: (user: User) => user.status === Status.INGAME, fun: spectate },
		{ condition: (user: User) => user.status !== Status.OFFLINE, fun: invite },
		{ condition: (user: User) => !blockedIds.includes(user.id), fun: block },
		{ condition: (user: User) => blockedIds.includes(user.id), fun: unblock },
		{ condition: (user: User) => true, fun: unfriend },
	]

	$: user = $userStore.get(user.id)!;
	$: state = [...$gameStateStore.values()].find((state) => state.roomId === user.activeRoomId) ?? null;
	$: blockedIds = [...$blockStore.keys()];

	async function unfriend(user: User) {
		await remove(`/user/me/friends/${user.id}`);

		swal().fire({ icon: "success", timer: 3000 });
	}

	async function invite(user: User) {
		const promise = swal().fire({
			title: "Invite to match",
			input: "radio",
			inputOptions: [ "Classic", "Modern", "VR" ],
			confirmButtonText: "Invite",
			showCancelButton: true,
		});
		
		const elements = document.getElementsByName("swal2-radio") as NodeListOf<HTMLInputElement>;
		const element = [...elements].find((element) => Number(element.value) === 0)!;

		element.checked = true;
	
		const { isConfirmed, value } = await promise;
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

		const room = await unwrap(post(`/game`, roomDto));
		const self = await unwrap(get(`/game/id/${room.id}/self`));
		const team = room.state.teams[0];
	
		await unwrap(post(`/game/id/${room.id}/invite`, { username: user.username }));
		await unwrap(patch(`/game/id/${room.id}/team/${self.id}`, { team: team.id }));

		swal().fire({
			title: "Go to game?",
			showConfirmButton: true,
			showCancelButton: true,
			confirmButtonText: "Go",
		}).then(async (result) => {
			if (result.isConfirmed) {
				await goto(`/game/${room.id}`);
			}
		});
	}

	async function spectate(user: User) {
		const id = user.activeRoomId;

		let member: GameRoomMember;

		try {
			member = await get(`/game/id/${id}/self`);
		} catch (_) {
			member = await unwrap(post(`/game/id/${id}/members`));
		}

		await patch(`/game/id/${id}/team/${member.id}`, { team: null });
		await goto(`/game/${id}`);
	}

	async function block(user: User) {
		await unwrap(post("/user/me/blocked", { id: user.id }));

		swal().fire({ icon: "success", timer: 3000 });
	}

	async function unblock(user: User) {
		await unwrap(remove(`/user/me/blocked/${user.id}`));
	
		swal().fire({ icon: "success", timer: 3000 });
	}

	function capitalize(name: string) {
		return `${name.slice(0, 1).toUpperCase()}${name.slice(1).toLowerCase()}`
	}

</script>

<Button color="alternative" class="friend-button avatar-status{user.status}">
	<!-- //TODO try and use the indicator instead of dot so it's possible to have custom colors -->
	<Avatar
		src={user.avatar}
		dot={{
			placement: "bottom-right",
			color: status_colors[user.status],
		}}
		class="mr-2 bg-c"
	/>
	<div class="block-cell">
		<div class="block-hor">{user.username}</div>
	</div>
</Button>
<Dropdown
	placement="left-end"
	inline
	class="bor-c bg-c"
	frameClass="bor-c bg-c"
>
	<DropdownItem href={`/profile/${encodeURIComponent(user.username)}`}>Profile</DropdownItem>
	{#each items as { condition, fun }}
		{#if condition(user)}
			<DropdownItem on:click={() => fun(user)}>{capitalize(fun.name)}</DropdownItem>
		{/if}
	{/each}
</Dropdown>
{#if state}
	<!-- <Match game={state} {user}/> -->
{/if}

<style>
	.block-cell {
		flex-direction: column;
		min-width: 100px;
		min-height: 40px;
		padding: 5px;
	}
</style>
