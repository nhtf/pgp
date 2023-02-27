<script lang="ts">
	import type { UpdatePacket } from "$lib/types";
	import type { Room } from "$lib/entities";
	import { page } from "$app/stores";
	import { Action, Subject } from "$lib/enums";
	import { updateManager } from "$lib/updateSocket";
	import { onDestroy, onMount } from "svelte";
	import RoomBox from "./RoomBox.svelte";

	export let type: "ChatRoom" | "GameRoom";

	let rooms: Map<number, Room> = new Map(($page.data.rooms).map((room: Room) => [room.id, room]));

	$: rooms;

	onMount(() => {
		updateManager.set(Subject.ROOM, (update: UpdatePacket) => {
			if (update.value.type === type) {
				switch (update.action) {
					case Action.ADD:
					case Action.SET:
						rooms = rooms.set(update.id, update.value);
						break;
					case Action.REMOVE:
						rooms.delete(update.id);
						rooms = rooms;
						break;
				}
			}
		});
	});

	onDestroy(() => {
		updateManager.remove(Subject.ROOM);
	});
</script>

{#each [...rooms] as [id, room] (id)}
	<RoomBox {room} />
{/each}
