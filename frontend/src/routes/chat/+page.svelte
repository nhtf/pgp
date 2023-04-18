<script lang="ts">
    import { post } from "$lib/Web";
    import { unwrap } from "$lib/Alert";
	import RoomInput from "$lib/components/RoomInput.svelte";
	import RoomOverview from "$lib/components/RoomOverview.svelte";
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { updateStore } from "$lib/stores";
    import { ChatRoom, User } from "$lib/entities";

	onMount(() => {
		const rooms: ChatRoom[] = $page.data.rooms;
	
		updateStore(ChatRoom, rooms);
		updateStore(User, rooms
			.filter(({ owner }) => owner !== undefined)
			.map(({ owner }) => owner!));
	});

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
