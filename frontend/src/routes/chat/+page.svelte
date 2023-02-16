<script lang="ts">
	import { unwrap } from "$lib/Alert";
	import { Action, Subject, type UpdatePacket } from "$lib/types";
	import { post } from "$lib/Web";
	import type { PageData } from "./$types";
	import { Checkbox } from "flowbite-svelte";
	import { onDestroy, onMount } from "svelte";
	import { updateManager } from "$lib/updateSocket";
    import RoomBox from "../RoomBox.svelte";

	export let data: PageData;

	$: rooms = data.roomsJoined.concat(data.roomsJoinable);

	const room: {
		name?: string;
		password?: string;
		is_private: boolean;
	} = {
		name: "",
		password: "",
		is_private: false,
	};

	onMount(() => {
		updateManager.set(Subject.ROOM, updateRooms);
	});

	onDestroy(() => {
		updateManager.remove(Subject.ROOM);
	});

	async function createChatRoom() {
		if (!room.password?.length) {
			delete room.password;
		}

		if (!room.name?.length) {
			delete room.name;
		}

		await unwrap(post(`/chat`, room));
	};

	function updateRooms(update: UpdatePacket) {
		switch (update.action) {
			case Action.ADD:
				rooms = [...rooms, update.value];
				break ;
			case Action.SET:
				if (rooms.map((room) => room.id).includes(update.identifier)) {
					if (update.value.is_private && !update.value.joined) {
						rooms = rooms.filter((room) => room.id !== update.identifier);
					} else {
						rooms = rooms.map((room) => room.id === update.identifier ? update.value : room);
					}
				} else {
					rooms = [...rooms, update.value];
				}
				break ;
			case Action.REMOVE:
				rooms = rooms.filter((room) => room.id !== update.identifier);
				break;
		}
	}

</script>

<div class="room-container">
	<div class="room room-create">
		<input
			class="input"
			type="text"
			placeholder="Room name"
			bind:value={room.name}
		/>
		<input
			class="input"
			type="password"
			autocomplete="off"
			placeholder="Room password"
			bind:value={room.password}
			disabled={room.is_private}
		/>
		<Checkbox bind:checked={room.is_private} class="checkbox"></Checkbox>
		<span class="label">Private</span>
		<div class="grow"/>
		<button class="button button-create" on:click={createChatRoom}>Create</button>
	</div>
	{#key rooms}
		{#each rooms as room}
			<RoomBox {room}/>
		{/each}
	{/key}
	
</div>

<style>

	.room-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 25px 10px;
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
		width: 80px;
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

	.button-create{
		border-color: var(--green);
	}

</style>
