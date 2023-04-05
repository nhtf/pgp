<script lang="ts">
	import { unwrap } from "$lib/Alert";
	import { put, remove } from "$lib/Web";
	import { Gamemode } from "$lib/enums";
	import { queueing } from "$lib/stores";
	import { Checkbox } from "flowbite-svelte";
    import { players } from "../../routes/game/[room]/Modern/Constants";

	const modes: { gamemode: Gamemode, players: number[], name: string }[] = [
		{ gamemode: Gamemode.CLASSIC, players: [2], name: "Classic" },
		{ gamemode: Gamemode.VR, players: [2], name: "VR" },
		{ gamemode: Gamemode.MODERN, players: [2, 4], name: "Modern" },
	];

	let options = modes.map(({ gamemode, players }) => { return { type: gamemode, player_counts: players } });

	async function queue() {
		await unwrap(put(`/match/me`, { gamemodes: options }));
		queueing.update(() => true);
	}

	async function dequeue() {
		await unwrap(remove(`/match/me`, { gamemodes: options }));
		queueing.update(() => false);
	}
</script>

<div class="room">
	{#each modes as { players, name }, index}
		<div class="flex flex-row gap-4">
			<span class="label">{name}</span>
			{#each players as player}
				<div class="flex flex-row gap-4">
					<Checkbox class="checkbox" />
					<div class="private-check">{player}</div>
				</div>
			{/each}
		</div>
	{/each}
	<div class="grow" />
	{#if !$queueing}
		<button class="button border-green" on:click={queue}>Find match</button>
	{:else}
		<div>Searching for match...</div>
		<button class="button border-red" on:click={dequeue}>Cancel</button>
	{/if}
</div>
