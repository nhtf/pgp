<script lang="ts">
	import type { UpdatePacket } from "$lib/types";
	import type { PageData } from "./$types";
	import { post } from "$lib/Web";
	import { unwrap } from "$lib/Alert";
	import { Subject, Action } from "$lib/enums";
	import { Checkbox, Select } from "flowbite-svelte";
    import { onDestroy, onMount } from "svelte";
    import { updateManager } from "$lib/updateSocket";
    import RoomBox from "$lib/components/RoomBox.svelte";

	export let data: PageData;

	let name = "";
	let is_private = false;
	let password = "";
	let gamemode = 0;

	let rooms = new Map(data.rooms.map((room) => [room.id, room]));

	$: rooms;

	onMount(() => {
		updateManager.set(Subject.ROOM, updateRooms);
	});

	onDestroy(() => {
		updateManager.remove(Subject.ROOM);
	});

	function updateRooms(update: UpdatePacket) {
		if (update.value.type === "GameRoom") {
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

	async function createGame() {
		const room: any = {};

		room.name = name.length ? name : null;
		room.password = password.length ? password : null;
		room.is_private = is_private;
		room.gamemode = gamemode;

		await unwrap(post("/game", room));
	}

	const gamemodes = [
		{ value: 0, name: "Classic" },
		{ value: 1, name: "VR" },
		{ value: 2, name: "Modern" },
	];

</script>

<div class="room-container">
	<div class="room room-create">
		<div>
			<input class="input" type="text" placeholder="Room name" bind:value={name}>
			<input class="input" type="text" placeholder="Room password" bind:value={password} disabled={is_private}>
			<Select defaultClass="select" items={gamemodes} placeholder="Gamemode" bind:value={gamemode}/>
			<Checkbox bind:checked={is_private} class="checkbox"/>
			<span class="label">Private</span>
		</div>
		<button class="button button-create" on:click={createGame}>Create</button>
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

	.label {
		line-height: 30px;
	}

	.button, .input {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
	}

	.button {
		width: 80px;
		text-align: center;
	}

	.input[type="text"] {
		width: 200px;
	}

	.input:disabled {
		opacity: 0.25;
	}

	.button-create {
		border-color: var(--green);
	}

</style>
