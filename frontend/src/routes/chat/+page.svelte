<script lang="ts">
    import { post } from "$lib/Web";
    import { unwrap } from "$lib/Alert";
	import RoomInput from "$lib/components/RoomInput.svelte";
	import RoomOverview from "$lib/components/RoomOverview.svelte";

	async function create(room: any) {
		room.name = room.name.length ? room.name : null;
		room.password = room.password.length ? room.password : null;

		await unwrap(post(`/chat`, room));
	}
</script>

<div class="flex flex-col m-3 gap-3 px-1 py-0.5">
	<RoomInput type={"ChatRoom"} click={create}/>
	<RoomOverview type={"ChatRoom"} />
</div>
