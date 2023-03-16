<script lang="ts">
	import type { User } from "$lib/entities";
	import { icon_path } from "$lib/constants";
	import { post } from "$lib/Web";
	import { friendStore, userStore } from "$lib/stores";
	import "@sweetalert2/theme-dark/dark.scss";
	import Friend from "./Friend.svelte";
    import { swal } from "$lib/Alert";
    import { byStatusThenName } from "$lib/sorting";

	const friend_icon = `${icon_path}/add-friend.png`;

	$: friends = [...$friendStore]
		.map(([id, _]) => $userStore.get(id)!)
		.sort(byStatusThenName);

	async function toggleAddfriend() {
		await swal().fire({
			title: "Add friend",
			input: "text",
			confirmButtonText: "Add friend",
			showCancelButton: true,
			inputValidator: async (username) => {
				try {
					await post(`/user/me/friends/requests`, { username });
				} catch (error: any) {
					return error.message;
				}
				return null;
			},
		}).then(async (result) => {
			if (result.isConfirmed) {
				swal().fire({
					position: "top-end",
					icon: "success",
					title: "Successfully sent friend request",
					showConfirmButton: false,
					timer: 1300,
				});
			}
		});
	}
</script>

<svelte:window />

<div class="block-cell self-flex-start bg-c bordered" id="friend-block">
	<div class="block-hor">
		<div class="block-cell">
			<h1>Friends</h1>
		</div>
		<div
			class="block-cell"
			on:click={toggleAddfriend}
			on:keypress={toggleAddfriend}
		>
			<img
				class="small-avatars"
				src={friend_icon}
				alt="friend-icon"
				title="add friend"
			/>
			add friend
		</div>
	</div>
	<div class="block-vert width-available">
		{#each friends as friend (friend.id)}
			<Friend user={friend} />
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

	.small-avatars {
		-webkit-filter: var(--invert);
		filter: var(--invert);
	}

	.self-flex-start {
		align-self: flex-start;
	}
</style>
