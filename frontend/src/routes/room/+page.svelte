<script lang="ts">
	import { goto } from "$app/navigation";
	import { unwrap } from "$lib/Alert";
	import { Access, Action, Subject, type ChatRoom, type UpdatePacket } from "$lib/types";
	import { post } from "$lib/Web";
	import Swal from "sweetalert2";
	import type { PageData } from "./$types";
	import ChatRoomBox from "./ChatRoomBox.svelte";
	import {Checkbox} from "flowbite-svelte";
	import { onDestroy, onMount } from "svelte";
	import { updateManager } from "$lib/updateSocket";

	export let data: PageData;

	$: rooms = setJoined(data.roomsJoined, true).concat(setJoined(data.roomsJoinable, false));
	$: joined = rooms.filter((room) => room.joined);
	$: joinable = rooms.filter((room) => !room.joined);

	let password = "";

	type room_dto = {
		name: string;
		is_private: boolean;
		password: string | undefined;
	};

	const room: room_dto = {
		name: "",
		is_private: false,
		password: undefined,
	};

	onMount(() => {
		updateManager.set(Subject.ROOM, updateRooms);

		console.log(rooms);
	});

	onDestroy(() => {
		updateManager.remove(Subject.ROOM);
	});

	function setJoined(rooms: ChatRoom[], joined: boolean): ChatRoom[] {
		return rooms.map((room) => { room.joined = joined; return room });
	}

	function enter(room: ChatRoom) {
		goto(`/room/${room.id}`);
	}

	async function createChatRoom() {
		if (password.length) {
			room.password = password;
		}

		const created = await unwrap(post("/room", room));

		enter(created);
	};

	async function join(room: ChatRoom) {
		if (room.access == Access.PROTECTED) {
			const { value: password, isDismissed } = await Swal.fire({
				text: "password",
				input: "password",
				inputPlaceholder: "password...",
			});

			if (isDismissed) {
				return ;
			}

			await unwrap(post(`/room/id/${room.id}/members`, { password }));
		} else {
			await unwrap(post(`/room/id/${room.id}/members`));
		}

		Swal.fire({
			icon: "success",
			text: "Joined room",
		});
	
		goto(`/room/${room.id}`);
	}

	function updateRooms(update: UpdatePacket) {
		switch (update.action) {
			case Action.SET:
				let room = rooms.find((room) => room.id === update.identifier) as ChatRoom;
				
				if (room) {
					room = update.value;
				} else {
					rooms.push(room);
				}
			
				rooms = rooms;
				break ;
			case Action.ADD:
				rooms = [...rooms, update.value];
				break ;
			case Action.REMOVE:
				rooms = rooms.filter((room) => room.id !== update.identifier);
				break;
		}
	}



</script>

<div class="room_list">
	<div class="room room-create">
		<div>
			<input class="input" type="text" placeholder="Room name" bind:value={room.name}>
			<p/>
			<input class="input" type="password" autocomplete="off" placeholder="Room password" bind:value={password} disabled={room.is_private}>
			<Checkbox bind:checked={room.is_private} class="checkbox"></Checkbox>
			<span class="label">Private</span>
		</div>
		<button class="button button-create" on:click={createChatRoom}>Create</button>
	</div>
	{#key joined}
		{#each joined as room}
			<ChatRoomBox divider={false} {room} click={enter}/>
		{/each}
	{/key}
	<div></div>
	{#key joinable}
		{#each joinable as room}
			<ChatRoomBox divider={false} {room} click={join}/>
		{/each}
	{/key}
	
</div>

<style>
	.room_list {
		display: flex;
		flex-direction: column;
		gap: 1em;
		margin: 1em;
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

	p {
		margin-top: 0.375rem;
	}
</style>
