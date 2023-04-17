<script lang="ts">
    import { post } from "$lib/Web";
    import { unwrap } from "$lib/Alert";
	import RoomInput from "$lib/components/RoomInput.svelte";
	import RoomOverview from "$lib/components/RoomOverview.svelte";

	async function create(room: any) {
		room.name = room.name.length ? room.name : undefined;
		room.password = room.password.length ? room.password : undefined;

		await unwrap(post(`/chat`, room));
	}
</script>

<div class="flex flex-col m-4 gap-2">
	<RoomInput type={"ChatRoom"} click={create}/>
	<RoomOverview type={"ChatRoom"} />
</div>
