<script lang="ts">
    import type { ChatRoom, GameRoom, Member, Room } from "$lib/entities";
    import { goto } from "$app/navigation";
    import { Role } from "$lib/enums";
    import { memberStore } from "$lib/stores";
	import { page } from "$app/stores";
    import { unwrap } from "$lib/Alert";
    import { remove } from "$lib/Web";

	export let room: Room;

	const route = room.type.replace("Room", "").toLowerCase();

	$: self = $memberStore.get(room.self!.id)!;

	async function leave(room: Room) {
		await unwrap(remove(`/${route}/${room.id}/members/${self.id}`));
		await goto(`/${route}`);
	}

	async function erase(room: Room) {
		await unwrap(remove(`/${route}/${room.id}`));
	}
	
</script>

<div class="room">
	<a class="button border-blue" href={`/${route}`}>Back</a>
	<div class="grow"/>
	<div class="text-4xl">{room.name}</div>
	<div class="grow"/>
	{#if room.owner?.id === $page.data.user.id}
		<button class="button border-red" on:click={() => erase(room)}>Erase</button>
	{:else}
		<button class="button border-red" on:click={() => leave(room)}>Leave</button>
	{/if}
	{#if self && self.role >= Role.ADMIN}
		<button class="button border-green" on:click={() => goto(`${$page.url}/settings`)}>Settings</button>
	{/if}				
</div>
