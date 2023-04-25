<script lang="ts">
    import type { PageData } from "./$types";
    import { Game, GameRoom, User } from "$lib/entities";
    import { updateStore } from "$lib/stores";
    import { unwrap } from "$lib/Alert";
    import { post } from "$lib/Web";
	import RoomOverview from "$lib/components/RoomOverview.svelte";
	import RoomInput from "$lib/components/RoomInput.svelte";
    import Queue from "$lib/components/Queue.svelte";

	export let data: PageData;

	updateStore(GameRoom, data.rooms);
	updateStore(Game, data.rooms.map(({ state }) => state!));
	updateStore(User, data.rooms
		.filter(({ owner }) => owner !== undefined)
		.map(({ owner }) => owner!)
	);

	async function create(room: any) {
		room.name = room.name.length ? room.name : undefined;
		room.password = room.password.length ? room.password : undefined;

		await unwrap(post(`/game`, room));
	}
</script>

<div class="page">
	<Queue/>
	<RoomInput type={"GameRoom"} click={create} buttonText={"create"}/>
	<RoomOverview type={"GameRoom"} />
</div>
