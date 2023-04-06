<script lang="ts">
	import { userStore } from "$lib/stores";
	import { Checkbox } from "flowbite-svelte";
	import { put, remove } from "$lib/Web";
	import { Gamemode } from "$lib/enums";
	import { unwrap } from "$lib/Alert";
	import { page } from "$app/stores";

	type QueueDTO = { type: Gamemode, player_counts: number[] }[];

	$: user = $userStore.get($page.data.user.id)!;

	const names = [ "Classic", "VR", "Modern" ]
	const modes: QueueDTO = [
		{ type: Gamemode.CLASSIC, player_counts: [2] },
		{ type: Gamemode.VR, player_counts: [2] },
		{ type: Gamemode.MODERN, player_counts: [2, 4] },
	];

	let checks: boolean[][] = [];
	let gamemodes: QueueDTO;

	$: checks = modes.map(({ player_counts }) => Array(player_counts.length).fill(true));

	$: gamemodes = modes.filter(({ type, player_counts }) => {
		return player_counts.filter((_, index) => {
			return checks[type][index];
		}).length > 0;
	});

	async function queue() {
		await unwrap(put(`/match/me`, { gamemodes }));
	}

	async function dequeue() {
		await unwrap(remove(`/match/me`, { gamemodes }));
	}
</script>

<div class="room gap-8">
	{#each modes as { player_counts, type }}
		<div class="spacing">
			<span class="label opacity-{user.queueing ? "50" : "100"}">{names[type]}:</span>
			{#each player_counts as player, index}
			<div class="spacing">
				{#if player_counts.length > 1}
					<span class="label">{player}P</span>
				{/if}
				<Checkbox bind:checked={checks[type][index]} disabled={user.queueing} class="checkbox" />
			</div>
			{/each}
		</div>
	{/each}
	<div class="grow" />
	{#if user.queueing}
		<div>Searching for match...</div>
		<button class="button border-red" on:click={dequeue}>Cancel</button>
	{:else}
		<button class="button border-green" on:click={queue}>Find match</button>
	{/if}
</div>

<style>
	.spacing {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
</style>
