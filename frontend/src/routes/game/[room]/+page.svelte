<script lang="ts">
	import type { PageData } from "./$types";
    import { gameStore } from "$lib/stores";
	import { Gamemode } from "$lib/enums";
    import { page } from "$app/stores";
	import ModernGameShader from "./Modern/ModernGameShader.svelte";
	import RoomHeader from "$lib/components/RoomHeader.svelte";
	import ClassicGame from "./Classic/ClassicGame.svelte";
	import VrGame from "./VR/VrGame.svelte";

	export let data: PageData;

	const room = data.room;
	const gamemode = room.state!.gamemode;
	const components = [ClassicGame, VrGame, ModernGameShader];

	$: team = [...$gameStore.values()]
		.find((game) => game.roomId === room.id)?.teams
		.find((team) => team.players?.some(({ userId }) => userId === $page.data.user.id));


</script>

{#if gamemode !== Gamemode.VR}
	<RoomHeader {room} />
	{#if team}
		<div class="room justify-center">{team.name}</div>
	{/if}
{/if}

<svelte:component this={components[gamemode]} {room} />
