<script lang="ts">
	import type { Room, Message } from "$lib/entities";
	import type { UpdatePacket } from "$lib/types";
	import type { PageData } from "./$types";
	import { onDestroy, onMount } from "svelte";
	import { roomSocket } from "../websocket";
	import { unwrap } from "$lib/Alert";
	import { patch, remove } from "$lib/Web";
	import { goto } from "$app/navigation";
	import { Subject, Role, Access } from "$lib/enums";
	import { updateManager } from "$lib/updateSocket";
	import { Checkbox, Dropdown, DropdownDivider, DropdownItem } from "flowbite-svelte";
	import { memberStore } from "../../../stores";
    import { icon_path } from "$lib/constants";
	import Invite from "$lib/components/Invite.svelte"
	import MessageBox from "$lib/components/MessageBox.svelte"
    import MemberBox from "$lib/components/MemberBox.svelte";

	export let data: PageData;

	const send_icon = `${icon_path}/send.svg`;

	let room = data.room;
	let messages = data.messages.sort(dateCmp)
	let self = data.members.find((member) => member.user.id === data.user!.id)!;

	$: room;
	$: members = [...$memberStore].map(([id, member]) => member).filter((member) => member.roomId === room.id);
	$: self = $memberStore.get(self.id)!;

	$: owner = members.find((member) => member.role === Role.OWNER)!;
	$: admins = members.filter((member) => member.role === Role.ADMIN);
	$: plebs = members.filter((member) => member.role === Role.MEMBER);

	$: messages;
	$: rows = (content.match(/\n/g) || []).length + 1 || 1;

	let content = "";
	let name = "";
	let password = "";
	let is_private = (room?.access === Access.PRIVATE);

	onMount(() => {
		updateManager.set(Subject.ROOM, (update: UpdatePacket) => {
			if (update.id === room.id) {
				room = update.value;
			}
		});

		roomSocket.emit("join", String(room.id));
	});

	onDestroy(() => {
		updateManager.remove(Subject.ROOM);
	});

	roomSocket.on("message", (message: Message) => {
		messages = [...messages, message].sort(dateCmp);
	});

	function dateCmp(first: Message, second: Message): number {
		const a = new Date(first.created).getTime();
		const b = new Date(second.created).getTime();

		return a - b;
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function sendMessage() {
		if (!content.length) return;

		roomSocket.emit("message", content);

		content = "";
	}

	async function leave(room: Room) {
		await unwrap(remove(`/chat/id/${room.id}/leave`));
		await goto(`/chat`);
	}

	async function erase(room: Room) {
		await unwrap(remove(`/chat/id/${room.id}`));
		await goto(`/chat`);
	}

	async function edit(room: Room) {
		const edit: any = {};

		edit.name = name.length ? name : null;
		edit.password = password.length ? password : null;
		edit.is_private = is_private;

		await unwrap(patch(`/chat/id/${room.id}`, edit));
	}
</script>

<div class="room">
	<div class="room-container">
		<div class="room-title">
			<button class="button blue" on:click={() => goto(`/chat`)}>Back</button>
			<div class="room-name">{room.name}</div>
			{#if self?.role >= Role.ADMIN}
				<Invite {room} />
			{/if}

			<!-- TODO: dont scroll when opening -->
			<!-- TODO: Add colors to buttons -->
			{#if self?.role > Role.MEMBER}
				<button class="button red">Settings</button>
				<Dropdown>
					{#if self?.role >= Role.OWNER}
						<input
							class="input"
							placeholder={room.name}
							bind:value={name}
						/>
						<input
							class="input"
							placeholder="password"
							bind:value={password}
						/>
						<Checkbox bind:checked={is_private} class="checkbox"
							>Private</Checkbox
						>
						<DropdownItem on:click={() => edit(room)}>Edit</DropdownItem>
						<DropdownDivider/>
						<DropdownItem on:click={() => erase(room)}>Delete</DropdownItem>
					{:else}
						<DropdownItem on:click={() => leave(room)}>Leave</DropdownItem>
					{/if}
				</Dropdown>
			{:else}
				<button class="button red" on:click={() => leave(room)}>Leave</button>
			{/if}				
		</div>

		<div class="messages">
			{#each messages as message (message.id)}
				<MessageBox {message} {self} />
			{/each}
		</div>
		<div class="message-input">
			<div class="message-box">
				{#key self}
					<textarea
						bind:value={content}
						on:keypress={handleKeyPress}
						wrap="hard"
						disabled={self?.is_muted}
						{rows}
						class="w-full space-x-4"
						placeholder={self?.is_muted
							? "You are muted"
							: "message..."}
					/>
				{/key}
			</div>
			<div
				class="send-button"
				on:click|preventDefault={sendMessage}
				on:keypress|preventDefault={sendMessage}
			>
				<img src={send_icon} alt="chat" class="icon" />
			</div>
		</div>
	</div>
	<div class="member-container">
		<div class="member-group">
			<MemberBox target={owner} {self}/>
		</div>
		<div/>
		<div class="member-group">
			{#each admins as member (member.id)}
				<MemberBox target={member} {self}/>
			{/each}
		</div>
		<div/>
		<div class="member-group">
			{#each plebs as member (member.id)}
				<MemberBox target={member} {self}/>
			{/each}
		</div>
	</div>
</div>

<style>
	.room {
		display: flex;
		flex-direction: row;
	}

	.member-container {
		display: flex;
		flex-direction: column;
		padding: 0.5rem;
		margin: 0.5rem;
		background-color: var(--box-color);
		border-radius: 1em;
		gap: 1em;
	}

	.member-group {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.room-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
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
		white-space: nowrap;
	}

	.button {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
		margin: 0.25rem;
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
