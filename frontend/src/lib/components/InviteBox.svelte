<script lang="ts">
	import type { Room, User } from "$lib/entities";
	import { Member } from "$lib/entities";
    import { memberStore, updateStore } from "$lib/stores";
	import { get, post } from "$lib/Web";
	import { unwrap } from "$lib/Alert";
    import { page } from "$app/stores";
    import UserSearch from "./UserSearch.svelte";
    import Swal from "sweetalert2";

	export let room: Room;

	let members: Member[] = [];
	let value = "";

	$: members = [...$memberStore.values()].filter(({ roomId }) => roomId === room.id);

	function isInvitable(user: User) {
		return (user.id !== $page.data.user.id && !members.some(({ userId }) => userId === user.id));
	}

	async function invite(room: Room, username: string) {
		await unwrap(post(`${room.route}/invite`, { username }));

		Swal.fire({ icon: "success", timer: 1000 });
		value = "";
	}

	async function onKeyPress(event: { detail: KeyboardEvent }) {
		if (event.detail.key === "Enter" && value != undefined && value.length >= 3) {
			await invite(room, value);
		}
	}

	async function fetchMembers() {
		updateStore(Member, await unwrap(get(`${room.route}/members`)));
	}

</script>

<div class="flex flex-row gap-4">
	<UserSearch bind:value filter={isInvitable} on:input|once={fetchMembers} on:keypress={onKeyPress}/>
	<button class="button border-green" on:click={() => invite(room, value)} disabled={!value || value.length < 3}>Invite</button>
</div>
