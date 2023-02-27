<script lang="ts">
	import RoomBox from "./RoomBox.svelte";
	import { roomStore } from "$lib/stores";

	export let type: "ChatRoom" | "GameRoom";

	$: rooms = [...$roomStore]
		.map(([_, room]) => room)
		.filter((room) => room.type === type);
</script>

{#each rooms as room (room.id)}
	<RoomBox {room} />
{/each}
