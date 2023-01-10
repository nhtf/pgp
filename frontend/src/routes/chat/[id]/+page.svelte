<script lang="ts">
    import { onMount } from "svelte";
    import socket from "../websocket";

	export let data: { room: any };

	let messages: any[] = [];
	$: messages;

	let body: String;

	onMount(() => {
		fetchMessages();
	});

	async function fetchMessages() {
		const endpoint = "http://localhost:3000/chat/messages";
		const response = await fetch(endpoint + "?id=" + data.room.id, {
			credentials: "include"
		})

		if (!response.ok) {
			return alert("Failed to load messages");
		}

		messages = await response.json()
	}

	function sendMessage(body: String) {
		console.log(body);
		socket.emit("sendMessage", body, (response: any) => {
		console.log(response);
	});

	}
</script>

{#each messages as message}
	<div>{message}</div>
{/each}

<form on:submit|preventDefault={() => sendMessage(body)}>
	<input bind:value={body} type="text"/>
	<input type="submit" value="Send"/>
</form>