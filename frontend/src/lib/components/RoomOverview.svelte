<script lang="ts">
	import { roomStore } from "$lib/stores";
	import RoomBox from "./RoomBox.svelte";

	export let type: "ChatRoom" | "GameRoom";

	$: rooms = [...$roomStore]
		.map(([_, room]) => room)
		.filter((room) => room.type === type);
</script>

{#each rooms as room (room.id)}
	<RoomBox {room} />
{/each}
