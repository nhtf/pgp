<script lang="ts">
	import type { Room } from "$lib/entities";
	import { Access, Gamemode, PLAYER_NUMBERS } from "$lib/enums";
	import { Checkbox, Select } from "flowbite-svelte";
    import { icon_path } from "$lib/constants";

	export let click: Function;
	export let room: Room | null = null;
	export let type: "ChatRoom" | "GameRoom" | "DM" | undefined = room?.type;
	export let buttonText: string;

	const checkmark = `${icon_path}/checkmark.svg`;

	let name = room ? room.name : "";
	let password = "";
	let is_private = room ? room.access === Access.PRIVATE : false;
	let gamemode = Gamemode.CLASSIC;

	$: players = PLAYER_NUMBERS.find(([mode]) => mode === gamemode)![1][0];

	function playerOptions(gamemode: Gamemode) {
		const players = PLAYER_NUMBERS.find(([mode]) => mode === gamemode)![1];

		return players.map((n) => {
			return { value: n, name: n };
		});
	}

	function onClick() {
		click({ name, password, is_private, gamemode, players }, room);

		name = "";
		password = "";
	}

	
</script>

<div class="room">
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
	<div class="private-check">
		<Checkbox custom bind:checked={is_private}>
			<div class="checkbox">
				{#if is_private}
					<img class="icon" src={checkmark} alt="checkmark" />
				{/if}
			</div>
		</Checkbox>
		<span class="label">Private</span>
	</div>
	{#if type === "GameRoom"}
		<Select
			defaultClass="select"
			items={PLAYER_NUMBERS.map(([gamemode, _, name]) => {
				return { value: gamemode, name };
			})}
			placeholder=""
			bind:value={gamemode}
		/>
		{#if gamemode === Gamemode.MODERN}
		<Select
			defaultClass="select"
			items={playerOptions(gamemode)}
			disabled={playerOptions(gamemode).length === 1}
			placeholder=""
			bind:value={players}
		/>
		{/if}
	{/if}
	<div class="grow" />
	<button
		class="button border-green"
		on:click={onClick}>{buttonText}</button
	>
</div>

<style>
	.private-check {
		align-items: center;
		column-gap: 0.5rem;
		display: flex;
	}

</style>
