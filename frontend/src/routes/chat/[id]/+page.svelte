<script lang="ts">
	import type { Room, Message } from "$lib/entities";
	import type { PageData } from "./$types";
	import type { UpdatePacket } from "$lib/types";
	import { onDestroy, onMount } from "svelte";
	import { roomSocket } from "../websocket";
	import { unwrap } from "$lib/Alert";
	import { remove } from "$lib/Web";
	import { goto } from "$app/navigation";
	import { Action, CoalitionColors, Role, Subject } from "$lib/enums";
	import { memberStore, roomStore, userStore } from "$lib/stores";
	import { updateManager } from "$lib/updateSocket";
	import { page } from "$app/stores";
	import MessageBox from "$lib/components/MessageBox.svelte"
	import MemberBox from "$lib/components/MemberBox.svelte";
	import ScratchPad from "$lib/components/ScratchPad.svelte";

	export let data: PageData;

	const role_colors = Object.values(CoalitionColors);

	let messages = data.messages.sort(dateCmp)
	let content = "";
	let indices: number[] = [];

	$: room = $roomStore.get(data.room.id)!;
	$: all = [...$memberStore.values()]
		.filter((member) => member.roomId === room?.id);
	$: self = $memberStore.get(data.member.id)!;
	$: messages;

	$: owner = all.find((member) => member.role === Role.OWNER)!;
	$: admins = all.filter((member) => member.role === Role.ADMIN);
	$: members = all.filter((member) => member.role === Role.MEMBER);

	onMount(() => {
		roomSocket.emit("join", String(room!.id));

		indices.push(onRemove(Subject.ROOM, room!.id));
		indices.push(onRemove(Subject.MEMBER, self.id));
	});

	onDestroy(() => {
		updateManager.remove(indices);
	});

	roomSocket.on("message", (message: Message) => {
		messages = [...messages, message].sort(dateCmp);
	});

	function onRemove(subject: Subject, id: number) {
		return updateManager.set(subject, async (update: UpdatePacket) => {
			if (update.id === id && update.action === Action.REMOVE) {
				await goto(`/chat`);
			}
		});
	}

	function getUser(id: number) {
		return $userStore.get(id)!;
	}

	function dateCmp(first: Message, second: Message): number {
		return first.created - second.created;
	}

	function sendMessage(message: string): boolean {
		if (message.length) {
			roomSocket.emit("message", message);
			content = "";
			return true;
		}
		return false;
	}

	async function leave(room: Room) {
		await unwrap(remove(`/chat/id/${room.id}/leave`));
		await goto(`/chat`);
	}

	function scrollToBottom(node: any, _: Message[]) {
		return {
			update() {
				node.scroll({ top: node.scrollHeight, behaviour: "smooth"});
			},
		};
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
					<button class="button border-green" on:click={() => goto(`${$page.url}/settings`)}>Settings</button>
				{/if}				
			</div>

			<div use:scrollToBottom={messages} class="messages">
				{#each messages as message (message.id)}
					<MessageBox {message} {self} />
				{/each}
			</div>
			<ScratchPad callback={sendMessage} disabled={self?.is_muted}/>
		</div>
		<div class="member-container">
			<div class="member-group">
				<h1 style={`color: #${role_colors[Role.OWNER]}`}>Owner</h1>
				<MemberBox user={getUser(owner.userId)} member={owner} {self} memberGroup={true}/>
			</div>
			{#if admins.length}
				<div/>
				<div class="member-group">
					<h1 style={`color: #${role_colors[Role.ADMIN]}`}>Admins</h1>
					{#each admins as member (member.id)}
						<MemberBox user={getUser(member.userId)} {member} {self} memberGroup={true}/>
					{/each}
				</div>
			{/if}
			{#if members.length}
				<div/>
				<div class="member-group">
					<h1 style={`color: #${role_colors[Role.MEMBER]}`}>Members</h1>
					{#each members as member (member.id)}
						<MemberBox user={getUser(member.userId)} {member} {self} memberGroup={true}/>
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
		margin: 0 0.5rem;
		background-color: var(--box-color);
		border-radius: 0.375rem;
		gap: 0.5em;
		align-items: center;
	}

	.member-group {
		display: flex;
		flex-direction: column;
		gap: 1em;
		align-items: center;
	}

	.room-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		height: calc(100vh - 90px);
	}

	.room-title {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		background-color: var(--box-color);
		position: relative;
		box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.4);
		margin-bottom: 0.75rem;
		padding: 0.25rem;
		border-radius: 0.375rem;
	}

	.room-name {
		text-align: center;
		font-size: 1.5rem;
		padding: 3px;
		margin: 0 auto;
		white-space: nowrap;
	}

	.messages {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
		/* top: 1.25rem; */
		overflow-y: auto;
	}

</style>
