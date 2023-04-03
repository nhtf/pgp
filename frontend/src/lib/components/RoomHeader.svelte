<script lang="ts">
    import type { Room } from "$lib/entities";
    import { memberStore, roomStore } from "$lib/stores";
    import { goto } from "$app/navigation";
    import { unwrap } from "$lib/Alert";
	import { page } from "$app/stores";
    import { Role } from "$lib/enums";
    import { remove } from "$lib/Web";
    import { Dropdown, DropdownHeader } from "flowbite-svelte";

	export let room: Room;

	$: room = $roomStore.get(room.id)!;
	$: self = $memberStore.get(room.self!.id)!;

	async function leave(room: Room) {
		await unwrap(remove(`${room.route}/members/${self.id}`));
		await goto(`/${room.nav}`);
	}

	async function erase(room: Room) {
		await unwrap(remove(room.route));
	}
	
</script>

<div class="room">
	<a class="button border-blue" href={`/${room.nav}`}>Back</a>
	<div class="grow"/>
	<div class="text-4xl">{room.name}</div>
	<div class="grow"/>
	{#if room.ownerId === $page.data.user.id}
		<button class="button border-red" on:click={() => erase(room)}>Erase</button>
	{:else}
		<button class="button border-red" on:click={() => leave(room)}>Leave</button>
	{/if}
	{#if self && self.role >= Role.ADMIN}
		<button class="button border-green" on:click={() => goto(`${$page.url}/settings`)}>Settings</button>
		<button class="button border-green">Dropdown</button>
		<Dropdown placement="left">
			<DropdownHeader>aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</DropdownHeader>
		</Dropdown>
	{/if}				
</div>
