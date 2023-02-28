<script lang="ts">
	import type { PageData } from "./$types";
	import { respond } from "$lib/invites";
	import { Tabs, TabItem } from "flowbite-svelte";
	import { inviteStore, userStore } from "$lib/stores";

	export let data: PageData;

	let open = [true, false];

	$: user = $userStore.get(data.user.id)!;
	$: invites = Array.from($inviteStore.values());
	$: send = invites.filter((invite) => invite.from.id === user.id);
	$: received = invites.filter((invite) => invite.to.id === user.id);
	
</script>

<div class="invite_list">
	<Tabs
		style="underline"
		divider
		defaultClass="flex flex-wrap space-x-2 bg-c rounded"
		contentClass="tab-content-background"
	>
		{#key invites}
			<TabItem
				bind:open={open[0]}
				class="bg-c rounded"
				defaultClass="rounded"
				title="send"
			>
				<div>
					{#each send as invite (invite.id)}
						<div class="invite">
							<div>
								{#if invite.to && invite.to.avatar}
									<img
										class="avatar"
										src={invite.to.avatar}
										alt=""
									/>
								{:else}
									<img
										class="avatar"
										src="/avatar-default.png"
										alt=""
									/>
								{/if}
							</div>
							<div>
								{invite.type} invitation to {invite.to.username}
							</div>
							<div>
								<button
									class="deny"
									on:click={() => respond(invite, "deny")}
									>Cancel</button
								>
							</div>
						</div>
					{/each}
				</div>
			</TabItem>

			<TabItem
				bind:open={open[1]}
				class="bg-c rounded"
				defaultClass="rounded"
				title="received"
			>
				<div>
					{#each received as invite (invite.id)}
						<div class="invite">
							<div>
								{#if invite.from && invite.from.avatar}
									<img
										class="avatar"
										src={invite.from.avatar}
										alt=""
									/>
								{:else}
									<img
										class="avatar"
										src="/avatar-default.png"
										alt=""
									/>
								{/if}
							</div>
							<div>
								{invite.type} invite from {invite.from.username}
							</div>
							<div class="buttons">
								<button
									class="confirm"
									on:click={() => respond(invite, "accept")}
									>Accept</button
								>
								<button
									class="deny"
									on:click={() => respond(invite, "deny")}
									>Deny</button
								>
							</div>
						</div>
					{/each}
				</div>
			</TabItem>
		{/key}
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

	.confirm {
		border: 1px solid var(--green) !important;
	}

	.confirm:hover,
	.deny:hover {
		background-color: var(--box-hover-color);
	}

	.deny {
		border: 1px solid var(--red) !important;
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
