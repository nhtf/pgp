<script lang="ts">
    import type { User } from "$lib/entities";
	import { friendStore, inviteStore, userStore } from "$lib/stores";
    import { byStatusThenName } from "$lib/sorting";
    import { unwrap } from "$lib/Alert";
    import { page } from "$app/stores";
    import { post } from "$lib/Web";
    import UserDropdown from "./UserDropdown.svelte";
    import UserSearch from "./UserSearch.svelte";
    import Swal from "sweetalert2";

	let value = "";

	$: invites = [...$inviteStore.values()];
	$: friends = [...$friendStore.keys()]
		.map((id) => $userStore.get(id)!)
		.sort(byStatusThenName);

	async function befriend(username: string) {
		await unwrap(post(`/user/me/friends`, { username }));
	
		Swal.fire({	icon: "success", timer: 1000, showConfirmButton: false });
	}

	function isBefriendable(user: User) {
		return (
			user.id !== $page.data.user?.id &&
			!friends.some(({ id }) => id === user.id) &&
			!invites.some((invite) => {
				return invite.type === "FriendRequest" && invite.to.id === user.id
			})
		);
	}

	function onKeyPress(event) {
		console.log("here");
	}

</script>

<div class="block-cell self-start bg-c bordered h-full">
	<div class="block-hor">
		<div class="flex gap-1">
			<UserSearch on:keypress={onKeyPress} bind:value filter={isBefriendable}/>
			<button
				class="button border-green"
				disabled={!value}
				on:click={() => befriend(value)}>Add</button
			>
		</div>
	</div>
	<div class="block-vert">
		{#each friends as user (user.id)}
			<UserDropdown {user} extend={true}/>
		{/each}
	</div>
</div>

<style>

	.block-vert {
		border: none;
		height: 100%;
		align-items: flex-start;
		width: 100%;
		padding: 0;
	}

	.block-cell {
		align-items: flex-start;
		flex-direction: column;
		min-height: 40px;
		padding: 1rem;
	}

</style>
