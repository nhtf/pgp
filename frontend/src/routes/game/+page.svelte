<script lang="ts">
	import RoomInput from "$lib/components/RoomInput.svelte";
	import RoomOverview from "$lib/components/RoomOverview.svelte";
    import { unwrap } from "$lib/Alert";
    import { post } from "$lib/Web";

	async function create(room: any) {
		room.name = room.name.length ? room.name : null;
		room.password = room.password.length ? room.password : null;

		await unwrap(post(`/game`, room));
	}
</script>

<div class="flex flex-col m-3 gap-3 px-1 py-0.5">
	<RoomInput type={"GameRoom"} click={create}/>
	<RoomOverview type={"GameRoom"} />
</div>
