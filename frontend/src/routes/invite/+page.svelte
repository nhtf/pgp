<script lang="ts">
    import type { Invite, User } from "$lib/entities";
	import type { PageData } from "./$types";
	import { inviteStore, userStore } from "$lib/stores";
	import { Tabs, TabItem } from "flowbite-svelte";

	export let data: PageData;

	const tabs: ["from" | "to", string, "from" | "to"][] = [
		["to", "Received", "from"],
		["from", "Sent", "to"],
	];

	$: user = $userStore.get(data.user!.id)!;
	$: invites = [...$inviteStore.values()];

	function filter(key: "from" | "to", user: User, invite: Invite) {
		return invite[key].id === user.id;
	}

	function getPrettyName(invite_type: string) {
		switch (invite_type) {
			case "ChatRoomInvite":
				return "Chat room";
			case "GameRoomInvite":
				return "Game room";
			case "FriendRequest":
				return "Friend";
			default:
				return "Unknown";
		}
	}

</script>

<!-- TODO: same as leaderboard -->
<div class="page gap-0">
	<Tabs style="underline" divider defaultClass="tab" contentClass="tab-content">
		{#each tabs as [key, title, opp], index}
			<TabItem {title} open={index === 0}>
				{#each invites.filter(filter.bind({}, key, user)) as invite (invite.id)}
					<div class="invite gap-4">
						<img class="avatar"	src={invite[opp].avatar} alt="avatar"/>
						<div class="text-2xl">{getPrettyName(invite.type)} invite {opp} {invite[opp].username}</div>
						<div class="grow"/>
						<button class="button border-green" on:click={() => invite.accept}>Accept</button>
						<button class="button border-red" on:click={() => invite.deny}>Deny</button>
					</div>
				{/each}
			</TabItem>
		{/each}
	</Tabs>
</div>

<style>

	.invite {
		background-color: var(--box-color);
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0.875rem;
		justify-content: space-evenly;
		font-size: 1rem;
		border-bottom-color: var(--border-color) !important;
		border-bottom-width: 2px;
	}

	.invite:hover {
		background-color: var(--box-hover-color);
	}

	.invite:first-child {
		margin-top: 0.25rem;
		border-top-left-radius: 6px;
		border-top-right-radius: 6px;
	}

	.invite:last-child {
		border-bottom-left-radius: 6px;
		border-bottom-right-radius: 6px;
	}

	/* .invite button {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
		font-size: 1rem;
	} */


	@media (max-width: 500px) {
		.invite {
			font-size: 1rem;
		}

		.invite button {
			font-size: 0.875rem;
		}

		.avatar {
			width: 35px;
			height: 35px;
		}
	}
</style>
