<script lang="ts">
	import { ChatRoom, type Message, ChatRoomMember, User } from "$lib/entities";
	import type { UpdatePacket } from "$lib/types";
	import type { PageData } from "./$types";
	import { Action, CoalitionColors, enumKeys, Role,  Subject } from "$lib/enums";
	import { blockStore, memberStore, roomStore, updateStore } from "$lib/stores";
	import { updateManager } from "$lib/updateSocket";
	import { onDestroy, onMount } from "svelte";
	import { byDate } from "$lib/sorting";
	import { unwrap } from "$lib/Alert";
    import { page } from "$app/stores";
	import { clamp } from "$lib/util";
	import { post } from "$lib/Web";
    import UserDropdown from "$lib/components/UserDropdown.svelte";
	import MessageBox from "$lib/components/MessageBox.svelte"
	import ScratchPad from "$lib/components/ScratchPad.svelte";
    import RoomHeader from "$lib/components/RoomHeader.svelte";

	export let data: PageData;

	const role_colors = Object.values(CoalitionColors);
	const role_names = [ "Members", "Admins", "Owner" ];
	const load = 20;

	let content = "";
	let messages = data.messages.sort(byDate);
	let index: number;
	let history = messages.filter(mine).length;
	let scroll = messages.length;
	let div: HTMLElement;

	$: room = $roomStore.get(data.room.id) as ChatRoom;
	$: members = [...$memberStore.values()].filter((member) => member.roomId === room?.id) as ChatRoomMember[];
	$: self = members.find(({ userId }) => userId === $page.data.user?.id);

	$: min = scroll - load;
	$: max = scroll + load;

	$: messages;
	$: my_messages = messages.filter(mine);
	$: history;

	updateStore(User, data.users);
	updateStore(ChatRoom, data.room);
	updateStore(ChatRoomMember, data.members);

	if (data.banned) {
		updateStore(User, data.banned);
	}

	onMount(() => {
		index = updateManager.set(Subject.MESSAGE, updateMessages);
	
		div.addEventListener("wheel", (event: WheelEvent) => {
			scroll = clamp(scroll + clamp(event.deltaY, -1, 1), 0, messages.length);
		});
	});

	onDestroy(() => {
		updateManager.remove(index);	
	});

	function mine(message: Message) {
		return message.userId === $page.data.user.id;
	}

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

	async function sendMessage(content: string) {
		if (content.length) {
			await unwrap(post(`${room.route}/messages`, { content }));
		}

		history = my_messages.length;
	}

	function scrollToBottom(node: any, _: Message[]) {
		return { update: () => node.scroll({ top: node.scrollHeight, behaviour: "smooth"}) };
	}

	function scrollDown() {
		scroll = messages.length;
		div.scroll({ top: div.scrollHeight, behavior: "smooth" });
	}

	function onKeydown(event: KeyboardEvent) {
		const keys = [
			{ key: "ArrowUp", change: -1 },
			{ key: "ArrowDown", change: +1 },
		];

		let ev = keys.find(({ key }) => key === event.key);

		if (ev !== undefined) {
			history = clamp(history + ev.change, 0, my_messages.length);
			content = my_messages[history] ? my_messages[history].content : "";
		}
	}
</script>

<svelte:window on:keydown={onKeydown}/>


{#if room && self}
	<div class="room-container-container">
		<div class="m-2">
			<RoomHeader {room}/>
		</div>
		<div class="room-page">
			<div class="room-container">
				<div bind:this={div} class="messages" id="messages" use:scrollToBottom={messages}>
					{#each messages.filter(({ userId }) => !$blockStore.has(userId)) as message, index (message.id)}
						{#if index >= min && index < max}
							<MessageBox {room} {message} {self} />
						{/if}
					{/each}
				</div>
				{#if scroll + load < messages.length}
					<button class="button middle" on:click={scrollDown}>Go to bottom</button>
				{/if}
				<ScratchPad bind:content callback={sendMessage} disabled={self?.is_muted}/>
			</div>
			<div class="member-container">
				<div class="members">
					{#each enumKeys(Role).reverse() as role}
						{#if members.some((member) => member.role === role)}
							<div class="member-group">
								<h1 style={`color: #${role_colors[role]}`}>{role_names[role]}</h1>
								{#each members.filter((member) => member.role === role) as member (member.id)}
									<UserDropdown {member} {room} extend={true}/>
								{/each}
							</div>
						{/if}
					{/each}
				</div>
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

	.member-container {
		display: flex;
		flex-direction: column;
		background-color: var(--box-color);
		border-radius: 1rem;
	}

	.messages {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		height: 0px;
		overflow: auto;
		scrollbar-color: var(--scrollbar-thumb) transparent;
	}

	.members {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		height: 0px;
		width: 200px;
		overflow-x: hidden;
		scrollbar-color: var(--scrollbar-thumb) transparent;
		padding: 0.5rem;
		gap: 2rem;
	}
      
	.member-group {
		align-items: flex-start;
		display: flex;
		flex-direction: column;
	}

</style>
