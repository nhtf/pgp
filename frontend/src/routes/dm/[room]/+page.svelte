<script lang="ts">
	import type { DMRoom, Message, User } from "$lib/entities";
	import type { UpdatePacket } from "$lib/types";
	import type { PageData } from "./$types";
	import { Action, Subject } from "$lib/enums";
	import { blockStore, roomStore, userStore } from "$lib/stores";
	import { updateManager } from "$lib/updateSocket";
	import { onDestroy, onMount } from "svelte";
	import { unwrap } from "$lib/Alert";
	import { post } from "$lib/Web";
	import { byDate } from "$lib/sorting";
    import { goto } from "$app/navigation";
	import MessageBox from "$lib/components/MessageBox.svelte"
	import ScratchPad from "$lib/components/ScratchPad.svelte";
    import UserDropdown from "$lib/components/UserDropdown.svelte";

	export let data: PageData;

	const load = 10;

	let messages = data.messages.sort(byDate);
	let relativeScroll = messages.length;
	let index: number;

	$: room = $roomStore.get(data.room.id) as DMRoom;
	$: other = $userStore.get(room.other!.id)!;

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

	async function block(user: User) {
		await unwrap(post(`/user/me/blocked`, { id: user.id }));
		await goto(`/dm`);
	}

</script>

<div class="room">
	<a class="button border-blue" href={`/dm`}>Back</a>
	<div class="grow"/>
	<UserDropdown user={other} extend={true}/>
	<div class="grow"/>
	<button class="button border-red" on:click={() => block(other)}>Block</button>		
</div>
<div class="room-page">
	<div class="room-container">
		<div class="messages" id="messages" use:scrollToBottom={messages}>
			{#each messages.filter(({ userId }) => !$blockStore.has(userId)) as message, index (message.id)}
				{#if index >= min}
					<MessageBox on:load|once={scroll} {room} {message} />
				{/if}
			{/each}
		</div>
		{#if relativeScroll + load < messages.length}
			<button class="button middle" on:click={scroll}>Go to bottom</button>
		{/if}
		<ScratchPad callback={sendMessage}/>
	</div>
</div>

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
	}

	.messages {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		overflow: auto;

		/* TODO */
		height: 70vh;
	}

</style>
