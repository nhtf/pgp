<script lang="ts">
    import { onMount } from "svelte";
    import Swal from "sweetalert2";
    import socket from "../websocket";
    import { unwrap } from "$lib/Alert";
    import type { Member, Message } from "$lib/types";
    import type { PageData } from "./$types";
    import { FRONTEND } from "$lib/constants";
    import { post, remove } from "$lib/Web";
    import { error } from "@sveltejs/kit";
    import MessageBox from "./MessageBox.svelte";

	export let data: PageData;

	if (!data.user) {
		throw error(401, "Unauthorized");
	}

	const room = data.room;
	const user = data.user;
	const member = room.members.find((member) => member.user.id === user.id) as Member;

	let messages = room.messages;

	let invitee: string = "";
	let content: string = "";

	onMount(() => {
		socket.emit("join", String(room.id));
	});

	socket.on("message", (data: Message) => {
		messages = [...messages, data];
	})

	function sendMessage() {
		if (!content.length) {
           return Swal.fire({
                icon: "warning",
                text: "Can't send empty messages",
				timer: 3000,
            });
		}
	
		socket.emit("message", content);
	}

    async function invite() {
		if (!invitee.length) {
			return Swal.fire({
                icon: "warning",
                text: "Please enter a username",
				timer: 3000,
            });
		}

		await unwrap(post(`/room/id/${room.id}/invite`, { username: invitee }));

		Swal.fire({
			icon: "success",
			timer: 1000,
		});
    }

	async function leave() {
		await unwrap(remove(`/room/id/${room.id}/leave`));

		window.location.assign(`${FRONTEND}/room`);
	}

    async function deleteChatRoom() {
        await unwrap(remove(`/room/id/${room.id}`));
	
		Swal.fire({
			icon: "success",
			timer: 3000,
		}).then(() => {
			window.location.assign(`${FRONTEND}/room`);
		});
    }

</script>

<h1 style="margin: 1em">{room.name}</h1>
{#each messages as message}
	<MessageBox id={room.id} {message} {member}/>
{/each}

<div class="option">
	<button on:click={leave}>Leave</button>
	<button on:click={deleteChatRoom}>Delete</button>
	<form on:submit|preventDefault={sendMessage}>
		<input bind:value={content} type="text" placeholder="message...">
		<input type="submit" value="Send"/>
	</form>
	<form on:submit|preventDefault={invite}>
		<input bind:value={invitee} type="text" placeholder="username...">
		<input type="submit" value="Invite">
	</form>
</div>
	
<style>
	h1 {
		background-color: steelblue;
		border-radius: 1em;
		padding: 1em;
	}

	.option {
		display: flex;
		flex-direction: column-reverse;
		gap: 1em;
		position: fixed;
		bottom: 1em;
		left: 1em;
		margin: 1em;
		align-items: baseline;
	}
</style>
