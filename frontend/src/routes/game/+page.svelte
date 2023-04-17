<script lang="ts">
    import { post } from "$lib/Web";
    import { unwrap } from "$lib/Alert";
	import RoomInput from "$lib/components/RoomInput.svelte";
	import RoomOverview from "$lib/components/RoomOverview.svelte";
    import Queue from "$lib/components/Queue.svelte";

	async function create(room: any) {
		room.name = room.name.length ? room.name : undefined;
		room.password = room.password.length ? room.password : undefined;

		await unwrap(post(`/game`, room));
	}
</script>

<div class="flex flex-col m-4 gap-2">
	<Queue/>
	<RoomInput type={"GameRoom"} click={create}/>
	<RoomOverview type={"GameRoom"} />
</div>
