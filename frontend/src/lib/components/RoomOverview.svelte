<script lang="ts">
	import type { Room } from "$lib/entities";
	import { roomStore } from "$lib/stores";
    import { slide } from "svelte/transition";
	import RoomBox from "./RoomBox.svelte";

	export let type: "ChatRoom" | "GameRoom";

	$: rooms = [...$roomStore.values()]
		.filter((room) => room.type === type)
		.sort((first: Room, second: Room) => {
			return first.joined ? (second.joined ? 0 : -1) : 1;
		});
</script>

{#each rooms as room (room.id)}
	<RoomBox {room} />
{/each}