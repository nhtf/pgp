<script lang="ts">
	import type { UpdatePacket } from "$lib/types";
	import type { PageData } from "./$types";
	import { unwrap } from "$lib/Alert";
	import { Subject, Action } from "$lib/enums";
	import { post } from "$lib/Web";
	import { Checkbox } from "flowbite-svelte";
	import { onDestroy, onMount } from "svelte";
	import { updateManager } from "$lib/updateSocket";
    import RoomBox from "$lib/components/RoomBox.svelte";

	export let data: PageData;

	let rooms = new Map(data.rooms.map((room) => [room.id, room]));
	let name = "";
	let password = "";
	let is_private = false;

	$: rooms;

	onMount(() => {
		updateManager.set(Subject.ROOM, updateRooms);
	});

	onDestroy(() => {
		updateManager.remove(Subject.ROOM);
	});

	async function createChatRoom() {
		const room: any = {};
	
		room.name = name ? name : null;
		room.password = password ? password : null;
		room.is_private = is_private;

		await unwrap(post(`/chat`, room));
	};

	function updateRooms(update: UpdatePacket) {
		if (update.value.type === "ChatRoom") {
			switch (update.action) {
				case Action.ADD:
				case Action.SET:
					rooms = rooms.set(update.id, update.value);
					break ;
				case Action.REMOVE:
					rooms.delete(update.id);
					rooms = rooms;
					break;
			}
		}
	}

</script>

<div class="room-container">
	<div class="room room-create">
		<input
			class="input"
			type="text"
			placeholder="Room name"
			bind:value={name}
		/>
		<input
			class="input"
			type="password"
			autocomplete="off"
			placeholder="Room password"
			bind:value={password}
			disabled={is_private}
		/>
		<Checkbox bind:checked={is_private} class="checkbox"></Checkbox>
		<span class="label">Private</span>
		<div class="grow"/>
		<button class="button button-green" on:click={createChatRoom}>Create</button>
	</div>
	{#each [...rooms] as [id, room] (id)}
		<RoomBox {room}/>
	{/each}
</div>

<style>

	.room-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px 10px;
		flex-wrap: wrap;
	}

	.room {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		background: var(--box-color);
		border: 2px var(--border-color);
		border-radius: 6px;
		padding: 25px;
	}

	.button {
		max-width: 80px;
		text-align: center;
	}

	.button, .input {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
	}

	.input:disabled {
		opacity: 0.25;
	}

	.button-green {
		border-color: var(--green);
	}

</style>
