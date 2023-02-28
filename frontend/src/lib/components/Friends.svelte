<script lang="ts">
	import type { User } from "$lib/entities";
	import { post, remove } from "$lib/Web";
	import { Status } from "$lib/enums";
	import { page } from "$app/stores";
	import { Button, Dropdown, DropdownItem, Avatar } from "flowbite-svelte";
	import { userStore } from "$lib/stores";
	import { icon_path, status_colors } from "$lib/constants";
	import "@sweetalert2/theme-dark/dark.scss";
	import Swal from "sweetalert2";

	const friend_icon = `${icon_path}/add-friend.png`;

	let score = new Map();

	$: self = $userStore.get($page.data.user?.id)!;
	$: friends = [...$userStore]
		.map(([_, user]) => user)
		.filter((user) => self.friendsIds.includes(user.id)).sort(byName);
	$: placement = window.innerWidth < 750 ? "top" : "left-end";

	function byName(first: User, second: User) {
		return first.username.localeCompare(second.username);
	}

	async function toggleAddfriend() {
		await Swal.fire({
			title: "Add friend",
			input: "text",
			color: "var(--text-color)",
			background: "var(--box-color)",
			confirmButtonColor: "var(--confirm-color)",
			cancelButtonColor: "var(--cancel-color)",
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
				Swal.fire({
					position: "top-end",
					icon: "success",
					title: "Successfully sent friend request",
					showConfirmButton: false,
					timer: 1300,
				});
			}
		});
	}

	async function removeFriend(id: number) {
		await remove(`/user/me/friends/${id}`);

		Swal.fire({ icon: "success", timer: 3000 });
	}

	function changePlacement() {
		placement = window.innerWidth < 750 ? "top" : "left-end";
	}

</script>

<svelte:window on:resize={changePlacement}/>

<!-- //TODO have the player status also update for in-game correctly -->
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
		{#if friends}
			{#key friends}
				{#each friends as { username, avatar, status, in_game, id }, index (id)}
					<Button
						color="alternative"
						id="avatar_with_name{index}"
						class="friend-button avatar-status{status}"
					>
					<!-- //TODO try and use the indicator instead of dot so it's possible to have custom colors -->
						<Avatar
							src={avatar}
							dot={{
								placement: "bottom-right",
								color: status_colors[status],
								
							}}
							class="mr-2 bg-c"
						/>
						<div class="block-cell">
							<div class="block-hor">{username}</div>
							{#if in_game}
								<div class="block-hor" id="in_game">
									playing
								</div>
								{#if score.has(username)}
									<div class="block-hor" id="scoredv">
										{score.get(username)}
									</div>
								{/if}
							{/if}
						</div>
					</Button>
					<div class="spacing" />
					{#key placement}
					<Dropdown
						{placement}
						inline
						triggeredBy="#avatar_with_name{index}"
						class="bor-c bg-c"
						frameClass="bor-c bg-c"
					>
						<DropdownItem
							href="/profile/{encodeURIComponent(username)}"
							>profile</DropdownItem
						>
						<!-- //TODO make the spectate and invite game actually functional -->
						{#if in_game}
							<DropdownItem>spectate</DropdownItem>
						{:else if status !== Status.OFFLINE}
							<DropdownItem>invite game</DropdownItem>
						{/if}
						<DropdownItem
							on:click={() => removeFriend(id)}
							slot="footer">unfriend</DropdownItem
						>
					</Dropdown>
					{/key}
				{/each}
			{/key}
		{/if}
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

	.spacing {
		padding-top: 1px;
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

	#online,
	#offline,
	#in_game,
	#scoredv,
	#active,
	#idle {
		position: relative;
		font-size: small;
		cursor: default;
		padding: 0;
		/* top: -15px; */
	}

	#online,
	#active {
		color: var(--blue);
	}
	#offline {
		color: var(--red);
	}
	#idle {
		color: var(--yellow);
	}
	#in_game,
	#scoredv {
		color: var(--green);
	}

	#scoredv {
		font-size: 10px;
		top: -5px;
	}

	.self-flex-start {
		align-self: flex-start;
	}

	/* #friend-hor {
		min-height: 55px;
		border: 2px solid var(--border-color);
	}

	@media (max-width: 750px) {
		.add-friend-window {
			width: 250px;
			height: 250px;
			top: calc(50% - 125px);
			left: calc(50% - 125px);
		}

		.input-field {
			width: 150px;
		}
	} */
</style>
