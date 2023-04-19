<script lang="ts">
	import { User, DMRoom, type Message } from "$lib/entities";
	import type { UpdatePacket } from "$lib/types";
	import type { PageData } from "./$types";
	import { Action, Subject } from "$lib/enums";
	import { blockStore, roomStore, updateStore, userStore } from "$lib/stores";
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

	$: room = $roomStore.get(data.room.id) as DMRoom | undefined;
	$: other = room?.other ? $userStore.get(room.other?.id) : undefined;
	$: blocked = other ? $blockStore.has(other.id) : false;

	$: messages;
	$: relativeScroll = clamp(relativeScroll, 0, messages.length);
	let scroll = messages.length;
	let div: HTMLElement;
	$: min = scroll - load;
	$: max = scroll + load;
	let content = "";
	// $: min = clamp(relativeScroll - load, 0, messages.length);

	updateStore(User, data.other);
	updateStore(DMRoom, data.room);

	onMount(() => {
		index = updateManager.set(Subject.MESSAGE, updateMessages);
	});

	onDestroy(() => {
		updateManager.remove(index);
	});

	addEventListener("wheel", (event: WheelEvent) => {
		relativeScroll += clamp(event.deltaY, -1, 1);;
	});

	async function updateMessages(update: UpdatePacket) {
		switch (update.action) {
			case Action.INSERT:
				if (update.value.roomId === room?.id){
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
			await unwrap(post(`${room?.route}/messages`, { content }));
		}
	}

	function scrollToBottom(node: any, _: Message[]) {
		return { update: () => node.scroll({ top: node.scrollHeight, behaviour: "smooth"}) };
	}

	function scrollDown() {
		const element = document.getElementById("messages")!;

		element.scroll({ top: element.scrollHeight, behavior: "smooth" });

		setTimeout(() => relativeScroll = messages.length - load, 1000);
	}

	async function block() {
		await unwrap(post(`/user/me/blocked`, { id: other?.id }));
		await goto(`/dm`);
	}

</script>

{#if room && other}
	<div class="room-container-container">
		<div class="m-2 flex-row flex bg-c bordered gap-4 p-2 items-center">
			<a class="button border-blue" href={`/dm`}>Back</a>
			<div class="grow"/>
			<UserDropdown user={other} extend={true}/>
			<div class="grow"/>
			{#if !blocked}
				<button class="button border-red" on:click={block}>Block</button>		
			{/if}
		</div>
		<div class="room-page">
			<div class="room-container">
				<div bind:this={div} class="messages" id="messages" use:scrollToBottom={messages}>
					{#each messages.filter(({ userId }) => !$blockStore.has(userId)) as message, index (message.id)}
						{#if index >= min && index < max}
							<MessageBox {room} {message} />
						{/if}
					{/each}
				</div>
				{#if scroll + load < messages.length}
					<button class="button middle" on:click={scrollDown}>Go to bottom</button>
				{/if}
				<ScratchPad bind:content callback={sendMessage}/>
			</div>
		</div>
	</div>
{/if}

<style>

	.middle {
		position: absolute;
		bottom: 5em;
		left: calc(50% - 100px - 0.1em);
		transform: translate(-50%, 0);
	}

	.room-container-container {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 4.5rem);
	}

	.room-page {
		display: flex;
		flex-grow: 1;
		margin: 0.25rem;
		align-items: stretch;
		gap: 0.2em;
	}

	.room-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		gap: 0.2em;
		width: calc(100% - 210px);
		max-height: calc(100vh - 11rem);
	}

	.messages {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		height: 0px;
		overflow: auto;
		scrollbar-color: var(--scrollbar-thumb) transparent;
	}

</style>
