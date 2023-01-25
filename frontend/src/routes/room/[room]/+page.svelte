<script lang="ts">
    import { onMount } from "svelte";
    import Swal from "sweetalert2";
    import socket from "../websocket";
    import { unwrap } from "$lib/Alert";
    import type { Message } from "$lib/types";
    import type { PageData } from "./$types";
    import { FRONTEND } from "$lib/constants";
    import { post, remove } from "$lib/Web";
    import { error } from "@sveltejs/kit";

	export let data: PageData;

	if (!data.user) {
		throw error(401, "Unauthorized");
	}

	const room = data.room;
	const user = data.user;

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

    async function deleteRoom() {
        await unwrap(remove(`/room/id/${room.id}`));
	
		Swal.fire({
			icon: "success",
			timer: 3000,
		}).then(() => {
			window.location.assign(`${FRONTEND}/room`);
		});
    }

</script>

<ul class="option">
	<li>
		<form on:submit|preventDefault={sendMessage}>
			<input bind:value={content} type="text" placeholder="message...">
			<input type="submit" value="Send"/>
		</form>
	</li>
	<li>
		<form on:submit|preventDefault={invite}>
			<input bind:value={invitee} type="text" placeholder="username...">
			<input type="submit" value="Invite">
		</form>
	</li>
	<li>
		<button on:click={leave}>Leave</button>
	</li>
	<li>
		<button on:click={deleteRoom}>Delete</button>
	</li>
</ul>

<h1 style="margin: 1em">{room.name}</h1>
{#each messages as message}
	{#if message.user.id == user.id}
		<div class="message" style="flex-direction: row-reverse">
			<img src={message.user.avatar} alt="">
			<div>{message.content}</div>
		</div>
	{:else}
		<div class="message">
			<img src={message.user.avatar} alt="">
			<div>{message.content}</div>
		</div>
	{/if}
{/each}

<style>

h1 {
	background-color: steelblue;
	border-radius: 1em;
	padding: 1em;
}

.option {
	position: fixed;
	bottom: 1em;
}

.option li {
	list-style: none;
	margin: 1em
}

.message {
	display: flex;
	flex-direction: row;
	font-size: 2em;
	gap: 1em;
	margin: 1em;
}

.message div {
	background-color: steelblue;
	border-radius: 1em;
	padding: 0em 1em;
}

.message img {
	width: 1em;
	height: 1em;
	border-radius: 1em;
}

.join {
	background-color: steelblue;
	padding: 1em 4em;
	margin: 1em;
	border-radius: 1em;
}

</style>
