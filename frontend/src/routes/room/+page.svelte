<script lang="ts">
	import { goto } from "$app/navigation";
	import { unwrap } from "$lib/Alert";
	import { Access, Action, Subject, type ChatRoom, type UpdatePacket } from "$lib/types";
	import { post } from "$lib/Web";
	import Swal from "sweetalert2";
	import type { PageData } from "./$types";
	import ChatRoomBox from "./ChatRoomBox.svelte";
	import { Checkbox } from "flowbite-svelte";
	import { onDestroy, onMount } from "svelte";
	import { updateManager } from "$lib/updateSocket";

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

	async function enter(room: ChatRoom) {
		await goto(`/room/${room.id}`);
	}

	async function createChatRoom() {
		if (!room.password?.length) {
			delete room.password;
		}

		if (!room.name?.length) {
			delete room.name;
		}

		const created: ChatRoom = await unwrap(post("/room", room));

		// await goto(`/room/${created.id}`);
	};

	async function join(room: ChatRoom) {
		let body: { name?: string, password?: string } = {};
	
		if (room.access == Access.PROTECTED) {
			const { value: password, isDismissed } = await Swal.fire({
				text: "password",
				input: "password",
				inputPlaceholder: "password...",
			});

			if (isDismissed) {
				return ;
			}

			body.password = password;
		}

		await unwrap(post(`/room/id/${room.id}/members`, body));

		Swal.fire({
			icon: "success",
			text: "Joined room",
		});
	
		goto(`/room/${room.id}`);
	}

	function updateRooms(update: UpdatePacket) {
		update.value.joined = (update.value.owner.id === data.user?.id);
	
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

<!-- {#if room.owner?.id === data.user?.id}
<input class="input" placeholder="Username" bind:value={room.data_username}>
<button class="button button-invite" on:click={() => inviteUser(room)}>Invite</button>
{/if}
<a class="button button-enter" href=/game/{room.id}>Enter</a>
{#if room.owner?.id === data.user?.id}
<button class="button button-delete" on:click={() => deleteGame(room)}>Delete</button>
{:else}
<button class="button button-leave" on:click={() => leaveGame(room)}>Leave</button>
{/if} -->

<div class="room_list">
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
		<button class="button button-create" on:click={createChatRoom}>Create</button>
	</div>
	{#each rooms as room}
		<ChatRoomBox divider={false} {room} click={room.joined ? enter : join}/>
	{/each}
	
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

	/* p {
		margin-top: 0.375rem;
	} */
</style>
