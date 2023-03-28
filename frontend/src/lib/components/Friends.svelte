<script lang="ts">
    import type { User } from "$lib/entities";
	import { friendStore, inviteStore, userStore } from "$lib/stores";
    import { byStatusThenName } from "$lib/sorting";
    import { unwrap } from "$lib/Alert";
    import { page } from "$app/stores";
    import { post } from "$lib/Web";
    import UserSearch from "./UserSearch.svelte";
	import Friend from "./Friend.svelte";
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
			!invites.find((invite) => {
				invite.type === "FriendRequest" && invite.to.id === user.id
			})
		);
	}

</script>

<div class="block-cell self-flex-start bg-c bordered" id="friend-block">
	<div class="block-hor">
		<div class="flex flex-row gap-1">
			<UserSearch bind:value filter={isBefriendable}/>
			<button
				class="button border-green"
				disabled={!value}
				on:click={() => befriend(value)}>Add</button
			>
		</div>
	</div>
	<div class="block-vert width-available">
		{#each friends as user (user.id)}
			<Friend {user} />
		{/each}
	</div>
</div>

<style>
	.width-available {
		width: -moz-available;
		width: -webkit-fill-available;
	}

	#friend-block {
		height: 100%;
	}

	.block-vert {
		flex-grow: 0.1;
		padding: 0;
		border: 0;
		height: 100%;
	}

	.block-cell {
		flex-direction: column;
		min-width: 100px;
		min-height: 40px;
		padding: 5px;
	}

	.block-cell:first-child {
		flex-grow: 1;
		text-align: center;
	}

	.self-flex-start {
		align-self: flex-start;
	}
</style>
