<script lang="ts">
	import type { Room, Message } from "$lib/entities";
	import type { PageData } from "./$types";
    import type { UpdatePacket } from "$lib/types";
	import { onDestroy, onMount } from "svelte";
	import { roomSocket } from "../websocket";
	import { unwrap } from "$lib/Alert";
	import { remove } from "$lib/Web";
	import { goto } from "$app/navigation";
	import { Action, Role, Subject } from "$lib/enums";
	import { memberStore, roomStore, userStore } from "$lib/stores";
    import { icon_path } from "$lib/constants";
    import { updateManager } from "$lib/updateSocket";
    import { page } from "$app/stores";
	import MessageBox from "$lib/components/MessageBox.svelte"
    import MemberBox from "$lib/components/MemberBox.svelte";

	export let data: PageData;

	const send_icon = `${icon_path}/send.svg`;

	let messages = data.messages.sort(dateCmp)
	let content = "";
	let indices: number[] = [];

	$: room = $roomStore.get(data.room.id)!;
	$: members = [...$memberStore]
		.map(([_, member]) => member)
		.filter((member) => member.roomId === room?.id);
	$: self = $memberStore.get(data.member.id)!;
	$: rows = (content.match(/\n/g) || []).length + 1 || 1;
	$: messages;

	$: owner = members.find((member) => member.role === Role.OWNER)!;
	$: admins = members.filter((member) => member.role === Role.ADMIN);
	$: plebs = members.filter((member) => member.role === Role.MEMBER);

	onMount(() => {
		roomSocket.emit("join", String(room!.id));

		indices.push(onRemove(Subject.ROOM, room!.id));
		indices.push(onRemove(Subject.MEMBER, self.id));
	});

	onDestroy(() => {
		updateManager.remove(indices);
	});

	function onRemove(subject: Subject, id: number) {
		return updateManager.set(subject, async (update: UpdatePacket) => {
			if (update.id === id && update.action === Action.REMOVE) {
				await goto(`/chat`);
			}
		});
	}

	roomSocket.on("message", (message: Message) => {
		messages = [...messages, message].sort(dateCmp);
	});

	function getUser(id: number) {
		return $userStore.get(id)!;
	}

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
		if (content.length) {
			roomSocket.emit("message", content);
			content = "";
		}
	}

	async function leave(room: Room) {
		await unwrap(remove(`/chat/id/${room.id}/leave`));
		await goto(`/chat`);
	}

</script>

{#if room}
	<div class="room">
		<div class="room-container">
			<div class="room-title">
				<a class="button border-blue" href={`/chat`}>Back</a>
				<div class="room-name">{room.name}</div>
				<button class="button border-red" on:click={() => leave(room)}>Leave</button>

				{#if self?.role >= Role.ADMIN}
					<button class="button" on:click={() => goto(`${$page.url}/settings`)}>Settings</button>
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
				<h1>Owner</h1>
				<MemberBox user={getUser(owner.userId)} member={owner} {self}/>
			</div>
			{#if admins.length}
				<div/>
				<div class="member-group">
					<h1>Admins</h1>
					{#each admins as member (member.id)}
						<MemberBox user={getUser(member.userId)} {member} {self}/>
					{/each}
				</div>
			{/if}
			{#if plebs.length}
				<div/>
				<div class="member-group">
					<h1>Members</h1>
					{#each plebs as member (member.id)}
						<MemberBox user={getUser(member.userId)} {member} {self}/>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.room {
		display: flex;
		flex-direction: row;
		margin: 0.5rem;
	}

	.member-container {
		display: flex;
		flex-direction: column;
		padding: 0.5rem;
		margin: 0.5rem;
		background-color: var(--box-color);
		border-radius: 1rem;
		gap: 0.5em;
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
		height: calc(100vh - 90px);
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
		padding: 0.25rem;
		border-radius: 2rem;
	}

	.room-name {
		text-align: center;
		font-size: 1.5rem;
		padding: 3px;
		margin: 0 auto;
		white-space: nowrap;
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
		color: var(--text-color);
		background-color: var(--input-bkg-color);
		border-radius: 6px;
		height: auto;
		max-height: 75vh;
	}

</style>
