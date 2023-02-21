<script lang="ts">
	import type { Member } from "$lib/entities";
	import { Avatar } from "flowbite-svelte";
	import { userStore } from "../../stores";

	export let member: Member | undefined;

	const status_colors = ["gray", "yellow", "green"];

	let user = member!.user;

	$: user = $userStore.get(user.id)!;
</script>

<Avatar
	src={user.avatar}
	title={user.username}
	dot={{
		placement: "bottom-right",
		color: status_colors[user.status],
	}}
/>
