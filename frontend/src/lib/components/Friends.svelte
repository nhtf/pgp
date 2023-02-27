<script lang="ts">
	import type { User } from "$lib/entities";
	import { get, post, remove } from "$lib/Web";
	import { Subject, Action, Status } from "$lib/enums";
	import Swal from "sweetalert2";
	import { page } from "$app/stores";
	import { onDestroy, onMount } from "svelte/internal";
	import { Button, Dropdown, DropdownItem, Avatar } from "flowbite-svelte";
	import { updateManager } from "$lib/updateSocket";
	import "@sweetalert2/theme-dark/dark.scss";
	import { inviteStore, userStore } from "../../stores";
	import { icon_path, status_colors } from "$lib/constants";

	let profile: User = $page.data.profile;
	let friends: User[] = $page.data.friends;

	const friend_icon = `${icon_path}/add-friend.png`;

	let score = new Map();
	let invitee = "";
	let all: User[] | null = null;

	$: profile = $userStore.get(profile.id)!;
	$: friends = [...$userStore]
		.map(([_, user]) => user)
		.filter((user) => friends.map((friend) => friend.id).includes(user.id));
	$: placement = window.innerWidth < 750 ? "top" : "left-end";

	onMount(() => {
		updateManager.set(Subject.FRIEND, updateFriends);
	});

	onDestroy(() => {
		updateManager.remove(Subject.FRIEND);
	});

	function byName(first: User, second: User) {
		return first.username.localeCompare(second.username);
	}

	async function befriendable() {
		const friendIds = friends.map((friend) => friend.id);
		const invites = [...$inviteStore]
			.map(([_, invite]) => invite)
			.filter(
				(invite) =>
					invite.type === "Friend" &&
					invite.from.id === $page.data.user.id
			);

		all = all ?? (await get(`/users`));
		return new Map(
			all!
				.filter((user) => $page.data.user.id !== user.id)
				.filter((user) => !friendIds.includes(user.id))
				.filter(
					(user) =>
						!invites.some((invite) => invite.to.id === user.id)
				)
				.sort(byName)
				.map((user) => [user.id, user.username])
		);
	}

	async function matches(users: User[]) {
		return users.filter((user) => user.username.includes(invitee));
	}

	async function toggleAddfriend() {
		await Swal.fire({
			title: "Add friend",
			input: "select",
			color: "var(--text-color)",
			background: "var(--box-color)",
			confirmButtonColor: "var(--confirm-color)",
			cancelButtonColor: "var(--cancel-color)",
			confirmButtonText: "Add friend",
			showCancelButton: true,
			inputOptions: befriendable(),
			inputValidator: async (id) => {
				try {
					await post(`/user/me/friends/requests`, { id });
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

	function updateFriends(update: any) {
		switch (update.action) {
			case Action.ADD:
				friends = [...friends, update.value];
				break;
			case Action.REMOVE:
				friends = friends.filter((friend) => friend.id !== update.id);
				break;
		}
	}

	function spectate(target: User) {
		
	}

</script>

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
		{#each friends as { username, avatar, status, in_game, id }, index (id)}
			<Button
				color="alternative"
				id="avatar_with_name{index}"
				class="friend-button"
			>
				<Avatar
					src={avatar}
					dot={{
						placement: "bottom-right",
						color: status_colors[status],
					}}
					class="mr-2"
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

	.spacing {
		padding-top: 1px;
	}

	.input-field {
		border-radius: 6px;
		width: 300px;
		font-size: 35px;
		background: var(--bkg-color);
		color: var(--text-color);
		border-color: var(--border-color);
	}

	.add-friend-window {
		display: flex;
		position: fixed;
		flex-direction: column;
		z-index: 25;
		top: calc(50% - 201px);
		left: calc(50% - 176px);
		background: var(--box-color);
		border-radius: 6px;
		border-width: 1px;
		border-color: var(--border-color);
		border-style: solid;
		box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
		width: 400px;
		height: 350px;
		justify-content: space-between;
		align-items: center;
		text-align: center;
		align-self: flex-end;
	}

	.close-button {
		display: flex;
		position: relative;
		align-self: flex-end;
		align-items: center;
		justify-content: center;
		top: 10px;
		right: 10px;
		cursor: pointer;
		margin-bottom: unset;
		left: unset;
	}

	.close-button:hover {
		box-shadow: 0 0 3px 2px var(--shadow-color);
		border-radius: 6px;
	}

	.image-selector {
		display: flex;
		position: relative;
		height: 30px;
		width: 100px;
		align-self: center;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		border-width: 1px;
		border-color: var(--scrollbar-thumb);
		border-style: solid;
		bottom: 20px;
		cursor: pointer;
	}

	.image-selector:hover {
		background: var(--tab-active-color);
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

	#friend-hor {
		min-height: 55px;
		border: 2px solid var(--border-color);
	}

	.self-flex-start {
		align-self: flex-start;
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
	}
</style>
