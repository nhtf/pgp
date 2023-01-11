<script lang="ts">
    import { onMount } from "svelte";
    import socket from "../websocket";

	export let data: {
		fetch: any
		user: {
			username: string,
			avatar: string
		},
		room: {
			id: string
		}
	};

	let messages: { user: { username: string, avatar: string }, content: string }[] = [];

	let body: string;

	onMount(() => {
		fetchMessages();
		socket.emit("joinRoom", { room_id: `${ data.room.id }` });
	});

	socket.on("message", (data: { user: any, content: string}) => {
		messages = [...messages, data];

		console.log(messages);
	})

	async function fetchMessages() {
		const endpoint = "http://localhost:3000/chat/messages";
		const response = await data.fetch(endpoint + "?id=" + data.room.id, {
			credentials: "include"
		})

		if (!response.ok) {
			return alert("Failed to load messages");
		}

		messages = await response.json()
	}

	function sendMessage(body: string) {
		let content = body.trim();

		if (content.length) {
			socket.emit("message", { room_id: `${ data.room.id }`, content: body });
		}
	}
</script>

{#each messages as message}
	<div class="message">
		<img src={message.user.avatar} alt="avatar">
		<div>{message.content}</div>
	</div>
{/each}

<form on:submit|preventDefault={() => sendMessage(body)}>
	<input bind:value={body} type="text"/>
	<input type="submit" value="Send"/>
</form>

<style>

.message {
	display: flex;
	flex-direction: row;
	font-size: 32px;
	gap: 1em;
	padding: 1em;
}

.message img {
	width: 1em;
	height: 1em;
	border-radius: 1em;
}

</style>
