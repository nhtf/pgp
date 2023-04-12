<script lang="ts">
    import type { Invite, User } from "$lib/entities";
	import type { PageData } from "./$types";
	import { inviteStore, userStore } from "$lib/stores";
	import { Tabs, TabItem } from "flowbite-svelte";

	export let data: PageData;

	let open = [true, false];

	$: user = $userStore.get(data.user.id)!;
	$: invites = [...$inviteStore.values()];

	function received(user: User, invite: Invite) {
		return invite.to.id === user.id;
	}

	function sent(user: User, invite: Invite) {
		return invite.from.id === user.id;
	}

</script>

<div class="invite_list">
	<Tabs
		style="underline"
		divider
		defaultClass="flex flex-wrap space-x-2 bg-c rounded"
		contentClass="tab-content-background"
	>
		<TabItem
			bind:open={open[0]}
			class="bg-c rounded"
			defaultClass="rounded"
			title="received"
		>
			{#each invites.filter(received.bind({}, user)) as invite (invite.id)}
				<div class="invite">
					<img class="avatar"	src={invite.from.avatar} alt="avatar"/>
					<div>{invite.type} invite from {invite.from.username}</div>
					<div class="buttons">
						<button
							class="border-green"
							on:click={() => invite.accept}
							>Accept</button
						>
						<button
							class="border-red"
							on:click={() => invite.deny}
							>Deny</button
						>
					</div>
				</div>
			{/each}
		</TabItem>
		<TabItem
			bind:open={open[1]}
			class="bg-c rounded"
			defaultClass="rounded"
			title="sent"
		>
				{#each invites.filter(sent.bind({}, user)) as invite (invite.id)}
					<div class="invite">
						<img class="avatar"	src={invite.from.avatar} alt="avatar"/>
						<div>{invite.type} invitation to {invite.to.username}</div>
						<button
							class="border-red"
							on:click={() => invite.deny}
							>Cancel</button
						>
					</div>
				{/each}
		</TabItem>
	</Tabs>
</div>

<style>
	.invite_list {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		position: relative;
		margin: 0 auto;
		width: 80%;
		top: 0.5rem;
		height: calc(100vh - 80px);
	}

	.invite {
		background-color: var(--box-color);
		/* border-radius: 6px; */
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0.875rem;
		justify-content: space-evenly;
		/* margin-top: 0.25rem; */
		font-size: 1.5rem;
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

	.invite button {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
		font-size: 1rem;
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 100%;
	}

	@media (max-width: 500px) {
		.invite_list {
			width: 100%;
		}

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

		.buttons {
			flex-direction: column;
			display: flex;
			row-gap: 0.25rem;
		}
	}
</style>
