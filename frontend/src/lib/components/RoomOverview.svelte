<script lang="ts">
	import type { ChatRoom, GameRoom } from "$lib/entities";
	import { roomStore } from "$lib/stores";
    import { byJoined } from "$lib/sorting";
	import RoomBox from "./RoomBox.svelte";

	export let type: "ChatRoom" | "GameRoom";

	$: rooms = [...$roomStore.values()]
		.filter((room) => room.type === type)
		.sort(byJoined) as (ChatRoom & GameRoom)[];

</script>

{#each rooms as room (room.id)}
	<RoomBox {room} />
{/each}