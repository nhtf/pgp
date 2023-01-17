<script lang="ts">
    import { onMount } from "svelte";
    import Swal from "sweetalert2";
    import socket from "../websocket";
	import type { Invite, Message, Room, User } from "../../../stores";
    import { doFetch, FRONTEND } from "../../../stores";

	export let data: {
		fetch: any,
		user: User,
		room: Room,
		invites: Invite[],
	};

	let invites: Invite[] = data.invites;
	let messages: Message[] = data.room.messages;
	let invitee: string = "";
	let body: string = "";

	onMount(() => {
		socket.emit("join", data.room.id);
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
		if (!invitee.length) {
			return Swal.fire({
                icon: "warning",
                text: "Please enter a username",
				timer: 3000,
            });
		}
		const response = await doFetch(data.fetch, "/chat/invite",
			{ method: "POST", credentials: "include" },
			{ username: invitee, id: data.room.id });

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

    async function deleteRoom() {
        const response = await doFetch(data.fetch, `/room/${data.room.id}`, { method: "DELETE" } );

        if (!response.ok) {
			const error = await response.json();
		
			return Swal.fire({
				icon: "error",
                text: error.message,
            });
        }

        window.location.assign(FRONTEND + "/chat");
    }

</script>

<ul class="option">
	<li>
		<form on:submit|preventDefault={sendMessage}>
			<input bind:value={body} type="text" placeholder="message...">
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
		<button on:click={deleteRoom}>Delete</button>
	</li>
</ul>

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

<h1 style="margin: 1em">Invites {invites.length}</h1>
{#each invites as invite}
	<div class="message">
		<div>From: {invite.from.username}</div>
		<div>To: {invite.to.username}</div>
	</div>
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

</style>
