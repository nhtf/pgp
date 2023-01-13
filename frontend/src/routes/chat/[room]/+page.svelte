<script lang="ts">
    import { onMount } from "svelte";
    import Swal from "sweetalert2";
    import socket from "../websocket";

	export let data: {
		fetch: any
		user: {
			username: string,
			avatar: string
		},
		room: {
			id: string
		},
	};

	let messages: {
		content: string,
		user: {
			username: string,
			avatar: string
		},
	}[] = [];

	let body: string;

	onMount(() => {
		fetchMessages();
		socket.emit("joinRoom", { room_id: `${ data.room.id }` });
	});

	socket.on("message", (data: { content: string, user: any }) => {
		messages = [...messages, data];
	})

	async function fetchMessages() {
		const endpoint = "http://localhost:3000/chat/messages";
		const response = await data.fetch(endpoint + "?id=" + data.room.id, {
			credentials: "include"
		});
	
		if (!response.ok) {
			const error = await response.json();
		
            return Swal.fire({
                icon: "error",
                text: error,
            });
		}

		messages = await response.json();
	}

	function sendMessage(body: string) {
		if (body == undefined) {
			return ;
		}
		let content = body.trim();

		if (content.length) {
			socket.emit("message", {
				room_id: `${ data.room.id }`,
				content: body,
			});
		} else {
           Swal.fire({
                icon: "warning",
                text: "Can't send empty messages",
				timer: 1000,
            });
		}
	}

</script>

<form class="send" on:submit|preventDefault={() => sendMessage(body)}>
	<input bind:value={body} type="text">
	<input type="submit" value="Send"/>
</form>

<div>
	{#each messages as message}
		<div class="message">
			<img src={message.user.avatar} alt="">
			<div>{message.content}</div>
		</div>
	{/each}
</div>

<style>

.send {
	position: fixed;
	bottom: 1em;
	left: 1em;
}

.message {
	display: flex;
	flex-direction: row;
	font-size: 3em;
	gap: 1em;
	padding: 1em;
}

.message img {
	width: 1em;
	height: 1em;
	border-radius: 1em;
}

</style>
