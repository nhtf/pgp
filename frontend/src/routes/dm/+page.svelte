<script lang="ts">
    import type { DMRoom, User } from "$lib/entities";
    import { roomStore } from "$lib/stores";
    import { unwrap } from "$lib/Alert";
    import { byId } from "$lib/sorting";
    import { post } from "$lib/Web";
	import { page } from "$app/stores";
    import UserSearch from "$lib/components/UserSearch.svelte";
    import DMRoomBox from "$lib/components/DMRoomBox.svelte";

	let value = "";

	$: rooms = ([...$roomStore.values()] as DMRoom[])
		.filter((room) => room.type === "DM")
		.sort(byId);

	function notInDms(user: User) {
		return !rooms.some((room) => user.id === room.other?.id) && user.username != $page.data.user.username;
	}

	async function onKeyPress(event: { detail: KeyboardEvent }) {
		if (event.detail.key === "Enter" && value != undefined && value.length >= 3)
			await create()
	}

	async function create() {
		await unwrap(post(`/dm`, { username: value }));
		value = "";
	}

</script>

<div class="page">
	<div class="room">
		<UserSearch bind:value filter={notInDms} on:keypress={onKeyPress}/>
		<div class="grow"/>
			<button class="button border-green" on:click={create} disabled={!value || value.length < 3}>Create</button>
	</div>
	{#each rooms as room (room.id)}
		<DMRoomBox {room}/>
	{/each}
</div>
