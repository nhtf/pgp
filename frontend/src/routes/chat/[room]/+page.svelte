<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import Swal from "sweetalert2";
    import { roomSocket } from "../websocket";
    import { unwrap } from "$lib/Alert";
    import type { PageData } from "./$types";
    import { post, remove } from "$lib/Web";
    import MessageBox from "./MessageBox.svelte";
    import { goto } from "$app/navigation";
    import { Role, Subject, type Message, type Room, type UpdatePacket, type User } from "$lib/types";
    import { updateManager } from "$lib/updateSocket";
    import { userStore } from "../../../stores";
    import Invite from "../../Invite.svelte";
    import { Dropdown, DropdownItem } from "flowbite-svelte";

	export let data: PageData;

	$: users = data.users!;
	$: members = data.members;
	$: room = data.room;
	$: self = members.find((member) => member.user.id === data.user!.id)!;
	$: messages = sortByDate(data.messages);
	$: rows = (content.match(/\n/g) || []).length + 1 || 1;
	$: invitable = data.users!.filter(notMember);
	$: matches = invitable.filter(match);

	let content: string = "";
	let invitee: string = "";

	onMount(() => {
		userStore.update((users) => {
			members.forEach((member) => {
				users.set(member.user.id, member.user);
			});

			return users;
		});
	
		userStore.subscribe((users) => {
			messages = messages.map((message) => {
				message.member.user = users.get(message.member.user.id)!;
			
				return message;
			});

			invitable = [...users.values()].filter(notMember);
		})

		updateManager.set(Subject.MEMBER, (update: UpdatePacket) => {
			messages = messages.map((message) => {
				if (message.member.id === update.id) {
					const user = message.member.user;
					
					message.member = update.value;

					message.member.user = user;
				}
			
				return message;
			});
		});
	
		roomSocket.emit("join", String(room.id));
	});

	function notMember(user: User) {
		return !members.map((member) => member.user.id).includes(user.id);
	}

	function match(user: User) {
		return user.username.includes(invitee);
	}

	onDestroy(() => {
		updateManager.remove(Subject.MEMBER);
	})

	roomSocket.on("message", (message: Message) => {
		messages = sortByDate([...messages, message]);
	});

	function sortByDate(messages: Message[]): Message[] {
		return messages.sort((first, second) => {
			const a = new Date(first.created).getTime();
			const b = new Date(second.created).getTime();
		
			return a - b;
		});
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function sendMessage() {
		if (!content.length)
           return;
	
		roomSocket.emit("message", content);
	
		content = "";
	}

	function updateInput() {
		matches = invitable.filter(match);
	}

    async function invite(room: Room) {
		if (!invitee.length) {
			return Swal.fire({
                icon: "warning",
                text: "Please enter a username",
				timer: 3000,
            });
		}

		await unwrap(post(`/chat/id/${room.id}/invite`, { username: invitee }));
		
		Swal.fire({
			icon: "success",
			timer: 1000,
		});
    }

	async function leave(room: Room) {
		await unwrap(remove(`/chat/id/${room.id}/leave`));
		await goto(`/chat`);
	}

    async function erase(room: Room) {
        await unwrap(remove(`/chat/id/${room.id}`));
		await goto(`/chat`);
    }

</script>

<div class="room-container">
	<div class="room-title">
		<button class="button blue" on:click={() => goto(`/chat`)}>Back</button>
		<div class="room-name">{room.name}</div>
		{#if data.role >= Role.ADMIN}
			<Invite {room} {members} {users}/>
		{/if}
		<button class="button">Settings</button>
		<Dropdown>
			<DropdownItem>
				{#if data.role >= Role.OWNER}
					<button class="button red" on:click={() => erase(room)}>Delete</button>
				{:else}
					<button class="button red" on:click={() => leave(room)}>Leave</button>
				{/if}
			</DropdownItem>
		</Dropdown>
	</div>

	<div class="messages">
		{#key messages}
			{#each messages as message}
				<MessageBox {message}/>
			{/each}
		{/key}
	</div>
	<div class="message-input">
		<div class="message-box">
			{#key self}
				<textarea
					bind:value={content}
					on:keypress={handleKeyPress}
					wrap="hard"
					disabled={self?.is_muted ? self.is_muted : false}
					rows="{rows}"
					class="w-full space-x-4"
					placeholder={self?.is_muted ? "You are muted" : "message..."}
				/>
			{/key}
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

	.room-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		height: calc(100vh - 80px);
		padding: 0 0 3rem 0;
	}

	.room-title {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		background-color: var(--box-color);
		position: relative;
		top: 0.5rem;
		box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
		margin-bottom: 0.5rem;
	}

	.room-name {
		text-align: center;
		font-size: 1.5rem;
		padding: 3px;
		margin: 0 auto;
	}

	.button {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
		margin: 0.25rem;
		width: 80px;
		text-align: center;
	}	
	
	.red {
		border-color: var(--red);
	}

	.blue {
		border-color: var(--blue);
	}

	.message-input {
		display: flex;
		position: relative;
		align-items: center;
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

	textarea {
		height: 5rem;
		color: var(--text-color);
		background-color: var(--input-bkg-color);
		border-radius: 6px;
		height: auto;
		max-height: 75vh;
	}

</style>
