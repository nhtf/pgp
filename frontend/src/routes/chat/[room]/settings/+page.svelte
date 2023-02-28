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
		<button class="button blue" on:click={() => goto(`/chat/${$page.params}`)}>Back</button>
		<div class="room-name">{room.name}</div>
	</div>
	<Invite {room} />
	{#if self.role >= Role.OWNER}
		<RoomInput {room} click={edit}/>
	{/if}
</div>


<style>
	.room {
		display: flex;
		flex-direction: column;
	}

	.room-title {
		display: flex;
		flex-direction: row;
		justify-content: center;
		background-color: var(--box-color);
		position: relative;
		top: 0.5rem;
		box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
		margin-bottom: 0.5rem;
		padding: 0.25rem;
		border-radius: 1em;
	}

	.button {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 1rem;
		padding: 0.25rem 1rem;
		margin: 0.25rem;
		text-align: center;
	}

	.blue {
		border-color: var(--blue);
	}

</style>
