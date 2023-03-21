<script lang="ts">
	import type { ChatRoom, Room, Message, ChatRoomMember } from "$lib/entities";
	import type { PageData } from "./$types";
	import type { UpdatePacket } from "$lib/types";
	import { onDestroy, onMount } from "svelte";
	import { roomSocket } from "../websocket";
	import { unwrap } from "$lib/Alert";
	import { remove } from "$lib/Web";
	import { goto } from "$app/navigation";
	import { Action, CoalitionColors, Role, roles, Subject } from "$lib/enums";
	import { blockStore, memberStore, roomStore } from "$lib/stores";
	import { updateManager } from "$lib/updateSocket";
	import { page } from "$app/stores";
	import { byDate } from "$lib/sorting";
	import MessageBox from "$lib/components/MessageBox.svelte"
	import MemberBox from "$lib/components/MemberBox.svelte";
	import ScratchPad from "$lib/components/ScratchPad.svelte";

	export let data: PageData;

	const role_colors = Object.values(CoalitionColors);
	const role_names = [ "Members", "Admins", "Owner" ];
	const load = 10;

	let messages = data.messages.sort(byDate);
	let indices: number[] = [];
	let relativeScroll = messages.length;

	$: room = $roomStore.get(data.room.id)! as ChatRoom;
	$: members = [...$memberStore.values()].filter((member) => member.roomId === room?.id);
	$: self = $memberStore.get(room.self!.id)! as ChatRoomMember;
	$: blockedIds = [...$blockStore.values()].map((user) => user.id);

	$: messages;
	$: relativeScroll = clamp(relativeScroll, 0, messages.length);
	$: min = clamp(relativeScroll - load, 0, messages.length);

	onMount(() => {
		roomSocket.emit("join", { id: room.id });

		indices.push(onRemove(Subject.ROOM, room!.id, async () => await goto(`/chat`)));
		indices.push(onRemove(Subject.MEMBER, self.id, async () => await goto(`/chat`)));
		indices.push(updateManager.set(Subject.MESSAGE, updateMessages));
	});

	onDestroy(() => {
		roomSocket.disconnect();
		updateManager.remove(indices);
	});

	addEventListener("wheel", (event: WheelEvent) => {
		const delta = clamp(event.deltaY, -1, 1);
	
		relativeScroll += delta;
	});

	function updateMessages(update: UpdatePacket) {
		switch (update.action) {
			case Action.INSERT:
				if (update.value.roomId === room.id){
					messages = [...messages, update.value];
				}
				break;
			case Action.REMOVE:
				messages = messages.filter((message) => message.id !== update.id);
				break;
		}
	}

	function onRemove(subject: Subject, id: number, fun: Function) {
		return updateManager.set(subject, async (update: UpdatePacket) => {
			if (update.id === id && update.action === Action.REMOVE) {
				fun();
			}
		});
	}

	function clamp(n: number, min: number, max: number): number {
		return n < min ? min : n > max ? max : n;
	}
	
	function sendMessage(message: string): boolean {
		if (message.length) {
			roomSocket.emit("message", message);
			return true;
		}
		return false;
	}

	async function leave(room: Room) {
		await unwrap(remove(`/chat/id/${room.id}/members/me`));
		await goto(`/chat`);
	}

	function scrollToBottom(node: any, _: Message[]) {
		return { update: () => node.scroll({ top: node.scrollHeight, behaviour: "smooth"}) };
	}

	function scroll() {
		const element = document.getElementById("messages")!;

		element.scroll({ top: element.scrollHeight, behavior: "smooth" });

		setTimeout(() => relativeScroll = messages.length, 1000);
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
			<div id="messages" class="messages" use:scrollToBottom={messages}>
				{#each messages as message, index (message.id)}
					{#if index >= min && !blockedIds.includes(message.userId)}
						<MessageBox on:load|once={scroll} {message} {self} />
					{/if}
				{/each}
			</div>
			{#if relativeScroll + load < messages.length}
				<button class="button middle" on:click={scroll}>Go to bottom</button>
			{/if}
			<ScratchPad callback={sendMessage} disabled={self?.is_muted}/>
		</div>
		<div class="member-container">
			{#each roles.slice().reverse() as role}
				{#if members.some((member) => member.role === role)}
					<div class="member-group">
						<h1 style={`color: #${role_colors[role]}`}>{role_names[role]}</h1>
						{#each members.filter((member) => member.role === role) as member (member.id)}
							<MemberBox {member} {self} memberGroup={true}/>
						{/each}
					</div>
					<div class="my-2"/>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<style>

	.middle {
		position: absolute;
		left: 40vw;
		bottom: 10vh;
	}
	.room {
		display: flex;
		flex-direction: row;
		margin: 0.5rem;
		align-items: stretch;
		/* TODO */
		height: 90vh;
	}

	.room-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		align-items: stretch;
		/* TODO */
		width: 80vw;
	}

	.room-title {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		border-radius: 1rem;
		background-color: var(--box-color);
		position: relative;
		box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.4);
		margin-bottom: 0.75rem;
		padding: 0.25rem;
	}

	.room-name {
		text-align: center;
		font-size: 1.5rem;
		margin: 0 auto;
		white-space: nowrap;
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
		gap: 0.5rem;
		align-items: center;
	}

	.messages {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		overflow-y: auto;
	}

</style>
