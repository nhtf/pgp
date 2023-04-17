<script lang="ts">
    import type { Room } from "$lib/entities";
    import { memberStore, roomStore } from "$lib/stores";
    import { goto } from "$app/navigation";
    import { unwrap } from "$lib/Alert";
	import { page } from "$app/stores";
    import { remove } from "$lib/Web";
    import { Role } from "$lib/enums";

	export let room: Room;

	$: room = $roomStore.get(room?.id)!;
	$: self = [...$memberStore.values()].find(({ roomId, userId }) => roomId === room?.id && userId === $page.data.user?.id);

	async function leave(room: Room) {
		await unwrap(remove(`${room.route}/members/${self?.id}`));
	}

	async function erase(room: Room) {
		await unwrap(remove(room.route));
	}

	function back(url: string): string {
		const index = url.lastIndexOf('/');

		return url.slice(0, index);
	}
	
</script>

{#if room}
	<div class="room flex-nowrap">
		<a class="button border-blue" href={back($page.url.pathname)}>Back</a>
		<div class="grow"/>
		<div class="name">{room.name}</div>
		<div class="grow"/>
		{#if room.owner?.id === $page.data.user.id}
			<button class="button border-red" on:click={() => erase(room)}>Delete</button>
		{:else}
			<button class="button border-red" on:click={() => leave(room)}>Leave</button>
		{/if}
		{#if room.type === "ChatRoom" && self && self.role >= Role.ADMIN}
			<button class="button border-green" on:click={() => goto(`${$page.url}/settings`)}>Settings</button>
		{/if}				
	</div>
{/if}

<style>
	.name {
		white-space: nowrap;
		overflow: hidden;
		font-size: large;
	}

</style>