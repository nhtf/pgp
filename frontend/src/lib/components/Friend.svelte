<script lang="ts">
	import type { GameRoomMember, User } from "$lib/entities";
	import { goto } from "$app/navigation";
	import { unwrap } from "$lib/Alert";
	import { status_colors } from "$lib/constants";
	import { Status } from "$lib/enums";
	import { gameStateStore, teamStore, userStore } from "$lib/stores";
	import { get, patch, post, remove } from "$lib/Web";
	import { Avatar, Button, Dropdown, DropdownItem } from "flowbite-svelte";
	import Swal from "sweetalert2";

	export let user: User;

	$: user = $userStore.get(user.id)!;
	$: state = [...$gameStateStore.values()].find((state) => state.roomId === user.activeRoomId) ?? null;
	$: teams = [...$teamStore.values()].filter((team) => team.stateId === state?.id) ??	null;

	async function unFriend(user: User) {
		await remove(`/user/me/friends/${user.id}`);

		Swal.fire({ icon: "success", timer: 3000 });
	}

	// TODO
	async function invite(user: User) {}

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
		await unwrap(post(`/user/me/block/${user.id}`));

		Swal.fire({ icon: "success", timer: 3000 });
	}

	async function unblock(user: User) {
		await unwrap(remove(`/user/me/unblock/${user.id}`));
	
		Swal.fire({ icon: "success", timer: 3000 });
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
	<DropdownItem href={`/profile/${encodeURIComponent(user.username)}`}
		>profile</DropdownItem
	>
	{#if user.status === Status.INGAME}
		<DropdownItem on:click={() => spectate(user)}>spectate</DropdownItem>
	{/if}
	{#if user.status !== Status.OFFLINE}
		<DropdownItem on:click={() => invite(user)}>invite game</DropdownItem>
	{/if}
	<DropdownItem on:click={() => block(user)}>block</DropdownItem>
	<DropdownItem on:click={() => unblock(user)}>unblock</DropdownItem>
	<DropdownItem on:click={() => unFriend(user)} slot="footer">unfriend</DropdownItem>
</Dropdown>
{#if user.activeRoomId}
	<div class="flex row">
		{#each teams as team, index (team.id)}
			{#if index > 0}
				<pre> - </pre>
			{/if}
			<div>{`${team.score}`}</div>
		{/each}
	</div>
{/if}

<style>
	.block-cell {
		flex-direction: column;
		min-width: 100px;
		min-height: 40px;
		padding: 5px;
	}
</style>
