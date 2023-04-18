<script lang="ts">
	import type { PageData } from "./$types";
    import { ChatRoom, User } from "$lib/entities";
    import { updateStore } from "$lib/stores";
    import { unwrap } from "$lib/Alert";
    import { post } from "$lib/Web";
	import RoomOverview from "$lib/components/RoomOverview.svelte";
	import RoomInput from "$lib/components/RoomInput.svelte";

	export let data: PageData;

	updateStore(ChatRoom, data.rooms);
	updateStore(User, data.rooms
		.filter(({ owner }) => owner !== undefined)
		.map(({ owner }) => owner!));

	async function create(room: any) {
		room.name = room.name.length ? room.name : undefined;
		room.password = room.password.length ? room.password : undefined;

		await unwrap(post(`/chat`, room));
	}
</script>

<div class="page">
	<RoomInput type={"ChatRoom"} click={create}/>
	<RoomOverview type={"ChatRoom"} />
</div>
