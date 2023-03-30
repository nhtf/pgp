<script lang="ts">
	import type { Member, Room, User } from "$lib/entities";
    import { memberStore, updateStore } from "$lib/stores";
	import { get, post } from "$lib/Web";
	import { unwrap } from "$lib/Alert";
    import { page } from "$app/stores";
    import UserSearch from "./UserSearch.svelte";
    import Swal from "sweetalert2";

	export let room: Room;

	const route = room.type.replace("Room", "").toLowerCase();

	let members: Member[] = [];
	let value = "";

	$: members = [...$memberStore.values()].filter(({ roomId }) => roomId === room.id);

	function isInvitable(user: User) {
		return (user.id !== $page.data.user.id && !members.some(({ userId }) => userId === user.id));
	}

	async function invite(room: Room, username: string) {
		await unwrap(post(`/${route}/${room.id}/invite`, { username }));

		Swal.fire({ icon: "success", timer: 1000 });
	}

	async function fetchMembers() {
		updateStore(memberStore, await unwrap(get(`/${route}/${room.id}/members`)));
	}

</script>

<div class="flex flex-row gap-4">
	<UserSearch bind:value filter={isInvitable} on:input|once={fetchMembers}/>
	<button class="button border-green" on:click={() => invite(room, value)}>Invite</button>
</div>