<script lang="ts">
	import type { ChatRoom, Message, ChatRoomMember } from "$lib/entities";
	import type { UpdatePacket } from "$lib/types";
	import type { PageData } from "./$types";
	import { Action, CoalitionColors, roles, Subject } from "$lib/enums";
	import { blockStore, memberStore, roomStore } from "$lib/stores";
	import { updateManager } from "$lib/updateSocket";
	import { onDestroy, onMount } from "svelte";
	import { byDate } from "$lib/sorting";
	import { unwrap } from "$lib/Alert";
    import { page } from "$app/stores";
	import { post } from "$lib/Web";
	import MessageBox from "$lib/components/MessageBox.svelte"
	import ScratchPad from "$lib/components/ScratchPad.svelte";
    import RoomHeader from "$lib/components/RoomHeader.svelte";
    import UserDropdown from "$lib/components/UserDropdown.svelte";

	export let data: PageData;

	const role_colors = Object.values(CoalitionColors);
	const role_names = [ "Members", "Admins", "Owner" ];
	const load = 10;

	let messages = data.messages.sort(byDate);
	let relativeScroll = messages.length;
	let index: number;

	$: room = $roomStore.get(data.room.id) as ChatRoom;
	$: members = [...$memberStore.values()].filter((member) => member.roomId === room?.id) as ChatRoomMember[];
	$: self = members.find(({ userId }) => userId === $page.data.user?.id);

	$: messages;
	$: relativeScroll = clamp(relativeScroll, 0, messages.length);
	$: min = clamp(relativeScroll - load, 0, messages.length);

	onMount(() => {
		index = updateManager.set(Subject.MESSAGE, updateMessages);
	});

	onDestroy(() => {
		updateManager.remove(index);
	});

	addEventListener("wheel", (event: WheelEvent) => {
		const delta = clamp(event.deltaY, -1, 1);
	
		relativeScroll += delta;
	});

	async function updateMessages(update: UpdatePacket) {
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

	function clamp(n: number, min: number, max: number): number {
		return n < min ? min : n > max ? max : n;
	}
	
	async function sendMessage(content: string) {
		if (content.length) {
			await unwrap(post(`${room.route}/messages`, { content }));
		}
	}

	function scrollToBottom(node: any, _: Message[]) {
		return { update: () => node.scroll({ top: node.scrollHeight, behaviour: "smooth"}) };
	}

	function scroll() {
		const element = document.getElementById("messages")!;

		element.scroll({ top: element.scrollHeight, behavior: "smooth" });

		setTimeout(() => relativeScroll = messages.length - load, 1000);
	}

	//TODO some more things to do with really large messages in the textarea
</script>

{#if room && self}
	<RoomHeader {room}/>
	<div class="room-page">
		<div class="room-container">
			<div class="messages" id="messages" use:scrollToBottom={messages}>
				{#each messages.filter(({ userId }) => !$blockStore.has(userId)) as message, index (message.id)}
					{#if index >= min}
						<MessageBox on:load|once={scroll} {room} {message} {self} />
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
							<UserDropdown {member} {room}/>
						{/each}
					</div>
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

	.room-page {
		display: flex;
		flex-direction: row;
		margin: 0.25rem;
		align-items: stretch;
	
		/* TODO */
		height: 80vh;
	}

	.room-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		width: 90%;
	}

	.messages {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		overflow: auto;

		/* TODO */
		/* height: 70vh; */
	}

	.member-container {
		align-items: center;
		background-color: var(--box-color);
		border-radius: 1rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 0.5rem;
	}
      
	.member-group {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

</style>
