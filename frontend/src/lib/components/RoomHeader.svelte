<script lang="ts">
    import type { ChatRoom, GameRoom } from "$lib/entities";
    import { goto } from "$app/navigation";
    import { Role } from "$lib/enums";
    import { memberStore } from "$lib/stores";
	import { page } from "$app/stores";
    import { unwrap } from "$lib/Alert";
    import { remove } from "$lib/Web";

	type T = ChatRoom | GameRoom;

	export let room: T;

	const route = room.type.replace("Room", "").toLowerCase();

	$: self = $memberStore.get(room.self!.id);

	async function leave(room: T) {
		await unwrap(remove(`/${route}/id/${room.id}/members/me`));
		await goto(`/${route}`);
	}

</script>

<div class="room">
	<a class="button border-blue" href={`/${route}`}>Back</a>
	<div class="grow"/>
	<div class="text-4xl">{room.name}</div>
	<div class="grow"/>
	<button class="button border-red" on:click={() => leave(room)}>Leave</button>
	{#if self && self.role >= Role.ADMIN}
		<button class="button border-green" on:click={() => goto(`${$page.url}/settings`)}>Settings</button>
	{/if}				
</div>
