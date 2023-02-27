<script lang="ts">
	import type { Room } from "$lib/entities";
	import { Access, Gamemode } from "$lib/enums";
	import { Checkbox, Select } from "flowbite-svelte";
	import { slide } from "svelte/transition";

	export let click: Function;
	export let room: Room | null = null;
	export let type: "ChatRoom" | "GameRoom" | undefined = room?.type;
	export let duration: number = 0;

	const gamemodes = new Map([
		[Gamemode.CLASSIC, { name: "Classic", players: [2] }],
		[Gamemode.VR, { name: "VR", players: [2] }],
		[Gamemode.MODERN, { name: "Modern", players: [2, 4] }],
		[Gamemode.MODERN4P, { name: "Modern4p", players: [4] }],
	]);

	let gamemode = Gamemode.CLASSIC;
	let name = room ? room.name : "";
	let password = "";
	let is_private = room ? room.access === Access.PRIVATE : false;
	let action = `${click.name.charAt(0).toUpperCase()}${click.name.slice(1)}`;

	$: players = gamemodes.get(gamemode)!.players[0];

	function playerOptions(gamemode: Gamemode) {
		const players = gamemodes.get(gamemode)!.players;

		return players.map((n) => {
			return { value: n, name: n };
		});
	}
</script>

<div transition:slide={{ duration }} class="room room-create">
	<input
		class="input"
		type="text"
		placeholder="Room name"
		bind:value={name}
	/>
	<input
		class="input"
		type="password"
		autocomplete="off"
		placeholder="Room password"
		bind:value={password}
		disabled={is_private}
	/>
	<Checkbox bind:checked={is_private} class="checkbox" />
	<span class="label">Private</span>
	{#if type === "GameRoom"}
		<Select
			defaultClass="select"
			items={[...gamemodes].map(([gamemode, info]) => {
				return { value: gamemode, name: info.name };
			})}
			placeholder=""
			bind:value={gamemode}
		/>
		<Select
			defaultClass="select"
			items={playerOptions(gamemode)}
			disabled={playerOptions(gamemode).length === 1}
			placeholder=""
			bind:value={players}
		/>
	{/if}
	<div class="grow" />
	<button
		class="button green"
		on:click={() =>
			click({ name, password, is_private, gamemode, players }, room)}
		>{action}</button
	>
</div>

<style>
	.room {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		background: var(--box-color);
		border: 2px var(--border-color);
		border-radius: 6px;
		padding: 25px;
	}

	.button,
	.input {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
	}

	.green {
		border-color: var(--green);
	}

	.input:disabled {
		opacity: 0.25;
	}
</style>
