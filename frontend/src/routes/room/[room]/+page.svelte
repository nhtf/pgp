<script lang="ts">
    import { onMount } from "svelte";
    import Swal from "sweetalert2";
    import socket from "../websocket";
    import { unwrap } from "$lib/Alert";
    import type { Member, Message } from "$lib/types";
    import type { PageData } from "./$types";
    import { FRONTEND, BACKEND } from "$lib/constants";
    import { post, remove } from "$lib/Web";
    import { error } from "@sveltejs/kit";
    import MessageBox from "./MessageBox.svelte";
	import {ToolbarButton, Dropdown, DropdownItem} from "flowbite-svelte";
    import ChatroomDrawer from "../ChatroomDrawer.svelte";
	import { beforeUpdate, afterUpdate } from 'svelte';


	export let data: PageData;

	if (!data.user) {
		throw error(401, "Unauthorized");
	}

	let div: HTMLElement;
	let autoscroll: boolean;

	const room = data.room;
	const user = data.user;
	// const member = room.members.find((member) => member.user.id === user.id) as Member;

	let messages = data.messages;

	let invitee: string = "";
	let content: string = "";

	onMount(() => {
		socket.emit("join", String(room.id));
	});

	beforeUpdate(() => {
		autoscroll = div && (div.offsetHeight + div.scrollTop) > (div.scrollHeight - 20);
	});

	afterUpdate(() => {
		if (autoscroll) div.scrollTo(0, div.scrollHeight);
	});

	socket.on("message", (data: Message) => {
		console.log("data: ", data);
		messages = [...messages, data];
	})

	function handleKeyPress(event) {
		console.log(event);
		if (event.key === "Enter" && !event.shiftKey)
			sendMessage();
	}

	function sendMessage() {
		console.log("content: ", content);
		if (!content.length)
           return;
		console.log("user", user);
		socket.emit("message", content);
		content="";
	}

    async function invite() {
		if (!invitee.length) {
			return Swal.fire({
                icon: "warning",
                text: "Please enter a username",
				timer: 3000,
            });
		}

		// const formData = new FormData();
		// formData.append("username", invitee);

		// const res = await window.fetch(`${BACKEND}/room/id/${room.id}/invite`, {
		// credentials: "include",
		// method: "POST",
		// body: formData,
		// });
		// console.log(res);
		await unwrap(post(`/room/id/${room.id}/invite`, {username: invitee} ));
		// if (res.ok){
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

<div class="chat-room-container">
	<div class="room-title">
		<ChatroomDrawer/>
		<h1 id="room-name">{room.name}</h1>
		<ToolbarButton class="chatroom-menu" id="title-button">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
		</ToolbarButton>
	</div>
	<Dropdown triggeredBy="#title-button" placement="bottom" class="bg-c bor-c">
		<DropdownItem class="flex items-center text-base font-semibold gap-2" on:click={leave}>leave</DropdownItem>
		{#if data.user?.username === data.room.owner.username}
		<DropdownItem class="flex items-center text-base font-semibold gap-2" on:click={deleteChatRoom}>delete</DropdownItem>
		<DropdownItem class="flex items-center text-base font-semibold gap-2">
		<form on:submit|preventDefault={invite}>
			<input class="user-invite" bind:value={invitee} type="text" placeholder="username...">
			<input class="invite-button" type="submit" value="Invite">
		</form>
	</DropdownItem>
		{/if}
	</Dropdown>

<div class="messages" bind:this={div}>
	{#if messages}
	{#each messages as message}
		<MessageBox id={room.id} {message} {user}/>
	{/each}
	{/if}
</div>

<div class="message-input">
	<div class="message-box">
		<textarea wrap="hard"
		on:keypress={handleKeyPress}
		bind:value={content}
		class="w-full space-x-4"  placeholder="message..."/>
	</div>
	<div class="send-button"
		on:click|preventDefault={sendMessage}
		on:keypress|preventDefault={sendMessage}
		>
		<img src="/Assets/icons/send.svg" alt="chat" class="icon">
	</div>
</div>
</div>
	
<style>

	textarea {
		height: 5rem;
		color: var(--text-color);
		background-color: var(--input-bkg-color);
		border-radius: 6px;
		height: fit-content;
	}

	.user-invite {
		width: 7.5rem;
		height: 40px;
		font-size: 0.75rem;
	}

	.invite-button {
		width: 2.5rem;
		height: 40px;
		font-size: 0.75rem;
	}

	.invite-button:hover {
		background-color: var(--box-hover-color);
	}
	
	#room-name {
		font-size: 1.5rem;
		padding: 3px;
		position: relative;
		margin: 0 auto;
	}

	.message-input {
		display: flex;
		position: relative;
		align-items: center;
		/* height: 50px; */
	}

	input {
		color: var(--text-color);
		background-color: var(--input-bkg-color);
		border-radius: 6px;
	}

	.message-box {
		width: 100%;
		margin-left: 0.375rem;
	}

	.icon {
        width: 30px;
        height: 30px;
        -webkit-filter: var(--invert);
		filter: var(--invert);
    }

	.room-title {
		background-color: var(--box-color);
		top: 0.5rem;
		position: relative;
		display: flex;
		width: 100%;
		flex-direction: row;
		border-radius: 6px;
		justify-content: space-between;
		box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
	}

	.messages {
		display: flex;
		height: 100%;
		flex-direction: column;
		position: relative;
		/* top: 1.25rem; */
		overflow-y: auto;
	}

	.send-button {
		display: flex;
		background-color: var(--box-color);
		height: 100%;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		width: 50px;
		cursor: pointer;
		margin-left: 0.375rem;
		margin-right: 0.375rem;
	}

	.send-button:hover {
		background-color: var(--box-hover-color);
	}

	.chat-room-container {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 80px);
		gap: 1.25rem;
	}

</style>
