<script lang="ts">
    import { onMount } from "svelte";
    import Swal from "sweetalert2";
    import socket from "../websocket";
    import type { Message, Room, User } from "../+page";

	export let data: {
		fetch: any
		user: User,
		room: Room,
	};

	let messages: Message[] = data.room.messages;
	let invitee: string = "";
	let body: string = "";

	console.log(messages);

	onMount(() => {
		socket.emit("joinRoom", data.room.id);
	});

	socket.on("message", (data: { content: string, user: any }) => {
		messages = [...messages, data];
	})

	function sendMessage() {
		if (body.length) {
			socket.emit("message", {
				room_id: data.room.id,
				content: body,
			});
		} else {
           Swal.fire({
                icon: "warning",
                text: "Can't send empty messages",
				timer: 3000,
            });
		}

		body = "";
	}

    async function invite() {
        const URL = "http://localhost:3000/chat/invite";
		const response = await data.fetch(URL + "?username=" + invitee, {
			method: "POST",
			credentials: "include",
		});

		if (!response.ok) {
			const error = await response.json();

			return Swal.fire({
				icon: "error",
				text: error.message,
			});
		}

		Swal.fire({
			icon: "success",
			timer: 1000,
		})
    }

</script>

<form class="send" on:submit|preventDefault={sendMessage}>
	<input bind:value={body} type="text">
	<input type="submit" value="Send"/>
</form>

<form class="invite" on:submit|preventDefault={invite}>
	<input bind:value={invitee} type="text" placeholder="username...">
	<input type="submit" value="Invite">
</form>

<h1 style="margin: 1em">{data.room.name}</h1>
{#each messages as message}
	{#if message.user.user_id == data.user.user_id}
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

.send {
	position: fixed;
	bottom: 1em;
	left: 1em;
}

.invite {
	position: fixed;
	bottom: 1em;
	right: 1em;
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

</style>
