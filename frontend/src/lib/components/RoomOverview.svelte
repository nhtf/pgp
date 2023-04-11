<script lang="ts">
    import type { Room } from "$lib/entities";
	import { roomStore } from "$lib/stores";
    import { byJoined } from "$lib/sorting";
	import RoomBox from "./RoomBox.svelte";

	type SortFunction = (first: Room, second: Room) => number;

	export let type: "ChatRoom" | "GameRoom" | "DM";
	export let sort: SortFunction = byJoined;

	$: rooms = [...$roomStore.values()]
		.filter((room) => room.type === type)
		.sort(sort);

</script>

{#each rooms as room (room.id)}
	<RoomBox {room} />
{/each}
