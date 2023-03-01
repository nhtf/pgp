<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { unwrap } from "$lib/Alert";
	import Invite from "$lib/components/Invite.svelte";
	import RoomInput from "$lib/components/RoomInput.svelte";
	import type { ChatRoom } from "$lib/entities";
	import { Action, Role, Subject } from "$lib/enums";
	import { memberStore, roomStore } from "$lib/stores";
	import type { UpdatePacket } from "$lib/types";
	import { updateManager } from "$lib/updateSocket";
	import { patch, remove } from "$lib/Web";
    import { Dropdown } from "flowbite-svelte";
	import { onDestroy, onMount } from "svelte";
	import type { PageData } from "./$types";

	export let data: PageData;

	let indices: number[] = [];

	$: self = $memberStore.get(data.member.id)!;
	$: room = $roomStore.get(data.room.id)!;

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
		await unwrap(remove(`/chat/id/${room.id}/leave`));
		await goto(`/chat`);
	}

	async function erase(room: ChatRoom) {
		await unwrap(remove(`/chat/id/${room.id}`));
		await goto(`/chat`);
	}
</script>

<div class="room">
	<div class="room-title">
		<a class="button border-blue" href={`/chat/${$page.params.id}`}>Back</a>
		<div class="room-name">{room.name}</div>
		<button class="button border-red" on:click={() => leave(room)}>Leave</button>
	</div>
	<div class="box">
		<Invite {room} />
	</div>
	{#if self.role >= Role.OWNER}
		<RoomInput {room} click={edit}/>
		<button class="button border-red" on:click={() => erase(room)}>Delete</button>
	{/if}
	<h1>Banned Users</h1>
	<div class="banned">
		{#each data.banned as user}
			<img class="avatar" src={user.avatar} alt="avatar"/>
		{/each}
	</div>
</div>


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
		border-radius: 1rem;
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
		border-radius: 2rem;
		padding: 0.5rem;
		margin-top: 0.25rem;
	}

	.banned {
		display: flex;
		flex-direction: row-reverse;
		gap: 1rem;
	}

</style>
