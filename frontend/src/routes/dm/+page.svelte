<script lang="ts">
    import type { DMRoom, User } from "$lib/entities";
    import { roomStore } from "$lib/stores";
    import { unwrap } from "$lib/Alert";
    import { byId } from "$lib/sorting";
    import { post } from "$lib/Web";
    import UserSearch from "$lib/components/UserSearch.svelte";
    import DMRoomBox from "$lib/components/DMRoomBox.svelte";

	let value = "";

	$: rooms = ([...$roomStore.values()] as DMRoom[])
		.filter((room) => room.type === "DM")
		.sort(byId);

	function notInDms(user: User) {
		return !rooms.some((room) => user.id === room.other?.id);
	}

	async function create() {
		await unwrap(post(`/dm`, { username: value }));
	}

</script>

<div class="flex flex-col m-4 gap-2 px-1 py-0.5">
	<div class="room">
		<UserSearch bind:value filter={notInDms}/>
		<div class="grow"/>
		<button class="button border-green" on:click={create}>Create</button>
	</div>
	{#each rooms as room (room.id)}
		<DMRoomBox {room}/>
	{/each}
</div>
