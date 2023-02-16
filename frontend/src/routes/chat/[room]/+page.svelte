<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import Swal from "sweetalert2";
    import { roomSocket } from "../websocket";
    import { unwrap } from "$lib/Alert";
    import type { PageData } from "./$types";
    import { post, remove } from "$lib/Web";
    import MessageBox from "./MessageBox.svelte";
	import { ToolbarButton, Dropdown, DropdownItem } from "flowbite-svelte";
	import { beforeUpdate, afterUpdate } from 'svelte';
    import { goto } from "$app/navigation";
    import { Role, Status, Subject, type Member, type Message, type UpdatePacket, type User } from "$lib/types";
    import MemberDrawer from "./MemberDrawer.svelte";
    import { updateManager } from "$lib/updateSocket";
    import { userStore } from "../../../stores";

	export let data: PageData;

	let div: HTMLElement;
	let autoscroll: boolean;

	$: room = data.room;
	$: messages = sortByDate(data.messages);
	$: members = [...new Set(messages.map((message) => message.member))];
	$: self = members.find((member) => member.user.id === data.user?.id) as Member;
	$: rows = (value.match(/\n/g) || []).length + 1 || 1;

	let textarea = null;
	let value: string = "";
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
				message.member.user = users.get(message.member.user.id) as User;
			
				return message;
			} );
		})

		updateManager.set(Subject.MEMBER, (update: UpdatePacket) => {
			messages = messages.map((message) => {
				if (message.member.id === update.identifier) {
					const user = message.member.user;
					
					message.member = update.value;

					message.member.user = user;
				}
			
				return message;
			});
		});
	
		roomSocket.emit("join", String(room.id));
	
		autoscroll = true;
	});

	onDestroy(() => {
		updateManager.remove(Subject.MEMBER);
	})

	beforeUpdate(() => {
		autoscroll = div && (div.offsetHeight + div.scrollTop) > (div.scrollHeight - 20);
	});

	afterUpdate(() => {
		if (autoscroll) {
			div.scrollTo(0, div.scrollHeight);
		}
	});

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
		if (!value.length)
           return;
	
		roomSocket.emit("message", value);
	
		value = "";
	}

    async function invite() {
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

	async function leave() {
		await unwrap(remove(`/chat/id/${room.id}/leave`));

		// TODO
		await goto(`/chat`);
	}

    async function deleteChatRoom() {
        await unwrap(remove(`/chat/id/${room.id}`));
	
		Swal.fire({
			icon: "success",
			timer: 3000,
		}).then(async () => {
			// TODO
			await goto(`/chat`);
		});
    }

	function onResize(e: UIEvent) {
		textarea = e.target;
	}

</script>

<div class="chat-room-container">
	<div class="room-title">
		<h1 id="room-name">{room.name}</h1>
		<ToolbarButton class="chatroom-menu" id="title-button">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
		</ToolbarButton>
		<MemberDrawer/>
	</div>
	<Dropdown triggeredBy="#title-button" placement="bottom" class="bg-c bor-c">
		<DropdownItem class="flex items-center text-base font-semibold gap-2" on:click={leave}>leave</DropdownItem>
		{#if self.role >= Role.OWNER}
			<DropdownItem class="flex items-center text-base font-semibold gap-2" on:click={deleteChatRoom}>delete</DropdownItem>
		{/if}
		{#if self.role >= Role.ADMIN}
			<DropdownItem class="flex items-center text-base font-semibold gap-2">
				<form on:submit|preventDefault={invite}>
					<input class="user-invite" bind:value={invitee} type="text" placeholder="username...">
					<input class="invite-button" type="submit" value="Invite">
				</form>
			</DropdownItem>
		{/if}
	</Dropdown>

<div class="messages" bind:this={div}>
	{#key messages}
		{#each messages as message}
			<MessageBox {message}/>
		{/each}
	{/key}
</div>
<div class="message-input">
	<div class="message-box">
		<textarea
			bind:value={value}
			bind:this={textarea}
			on:resize={onResize}
			on:keypress={handleKeyPress}
			wrap="hard"
			disabled={self?.is_muted ? self.is_muted : false}
			rows="{rows}"
			class="w-full space-x-4"
			placeholder={self?.is_muted ? "You are muted" : "message..."}
		/>
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
		height: auto;
		max-height: 75vh;
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
