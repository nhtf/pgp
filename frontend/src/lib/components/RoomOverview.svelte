<script lang="ts">
	import { roomStore } from "$lib/stores";
    import { byJoined } from "$lib/sorting";
	import RoomBox from "./RoomBox.svelte";

	export let type: "ChatRoom" | "GameRoom";

	$: rooms = [...$roomStore.values()]
		.filter((room) => room.type === type)
		.sort(byJoined);

</script>

<!-- TODO: fix type error -->
{#each rooms as room (room.id)}
	<RoomBox {room} />
{/each}