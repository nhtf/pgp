<script lang="ts">
	import type { UpdatePacket } from "$lib/types";
	import type { ChatRoom, User } from "$lib/entities";
	import type { PageData } from "./$types";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { unwrap } from "$lib/Alert";
	import { Action, Role, Subject } from "$lib/enums";
	import { memberStore, roomStore } from "$lib/stores";
	import { updateManager } from "$lib/updateSocket";
	import { patch, remove } from "$lib/Web";
	import { onDestroy, onMount } from "svelte";
	import {
		Dropdown,
		Avatar,
		Tooltip,
		DropdownHeader,
		DropdownItem,
	} from "flowbite-svelte";
	import RoomInput from "$lib/components/RoomInput.svelte";
	import Invite from "$lib/components/Invite.svelte";
	import Swal from "sweetalert2";

	export let data: PageData;

	let indices: number[] = [];

	$: self = $memberStore.get(data.member.id)!;
	$: room = $roomStore.get(data.room.id)!;
	$: banned = data.banned;

	onMount(() => {
		indices.push(onRemove(Subject.ROOM, room.id));
		indices.push(onRemove(Subject.MEMBER, self.id));
	});

	onDestroy(() => {
		updateManager.remove(indices);
	});

	function onRemove(subject: Subject, id: number) {
		return updateManager.set(subject, async (update: UpdatePacket) => {
			if (update.id === id && update.action === Action.REMOVE) {
				await goto(`/chat`);
			}
		});
	}

	async function edit(edit: any, room: ChatRoom) {
		edit.name = edit.name.length ? edit.name : null;
		edit.password = edit.password.length ? edit.password : null;

		await unwrap(patch(`/chat/id/${room.id}`, edit));
	}

	async function leave(room: ChatRoom) {
		await unwrap(remove(`/chat/id/${room.id}/members/me`));
		await goto(`/chat`);
	}

	async function erase(room: ChatRoom) {
		await unwrap(remove(`/chat/id/${room.id}`));
		await goto(`/chat`);
	}

	async function unban(user: User) {
		await unwrap(remove(`/chat/id/${room.id}/bans/${user.id}`));

		Swal.fire({
			icon: "success",
			timer: 3000,
		});
	
		banned = banned.filter((user) => user.id !== user.id);
	}
</script>

{#if room}
	<div class="room">
		<div class="room-title">
			<a class="button border-blue" href={`/chat/${$page.params.id}`}>Back</a>
			<div class="room-name">{room.name} settings</div>
			{#if self.role < Role.OWNER}
				<button class="button border-red" on:click={() => leave(room)}
					>Leave</button
				>
			{:else}
				<button class="button border-red" on:click={() => erase(room)}
					>Delete</button
				>
			{/if}
		</div>
		<div class="box">
			<Invite {room} />
		</div>
		{#if self.role >= Role.OWNER}
			<RoomInput {room} click={edit} />
		{/if}
		<div class="box">
			<h1>Banned Users</h1>
			<div class="banned">
				{#each banned as user}
					<Avatar
						src={user.avatar}
						id="avatar-{user.username}"
						class="bg-c"
					/>
					<Tooltip triggeredBy="#avatar-{user.username}"
						>{user.username}</Tooltip
					>
					<Dropdown
						triggeredBy="#avatar-{user.username}"
						class="bor-c bg-c shadow rounded max-w-sm"
					>
						<DropdownHeader>
							{user.username}
						</DropdownHeader>
						<DropdownItem on:click={() => unban(user)}
							>Unban
						</DropdownItem>
					</Dropdown>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.room {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		margin: 0.5rem;
		gap: 0.5rem;
	}

	.room-title {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		background-color: var(--box-color);
		position: relative;
		top: 0.5rem;
		box-shadow: 2px 4px 6px 2px rgba(0, 0, 0, 0.4);
		margin-bottom: 0.5rem;
		padding: 0.25rem;
		border-radius: 0.375rem;
		width: 100%;
	}

	.room-name {
		text-align: center;
		font-size: 1.5rem;
		margin: 0 auto;
	}

	.box {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--box-color);
		border: 1px var(--border-color);
		border-radius: 0.375rem;
		padding: 0.5rem;
		margin-top: 0.25rem;
		flex-direction: column;
		column-gap: 0.5rem;
	}

	h1 {
		margin-bottom: 0.5rem;
	}

	.banned {
		display: flex;
		flex-direction: row-reverse;
		gap: 1rem;
	}
</style>
