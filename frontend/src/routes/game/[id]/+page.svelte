<script lang="ts">
	import type { PageData } from "./$types";
	import { Gamemode } from "$lib/enums";
	import ClassicGame from "./Classic/ClassicGame.svelte";
	import VrGame from "./VR/VrGame.svelte";
	import ModernGameShader from "./Modern/ModernGameShader.svelte";
	import RoomHeader from "$lib/components/RoomHeader.svelte";

	export let data: PageData;

	const room = data.room;
	const gamemode = room.state.gamemode;
	const components = [ClassicGame, VrGame, ModernGameShader];
</script>

{#if gamemode !== Gamemode.VR}
	<RoomHeader {room} />
{/if}

<svelte:component this={components[gamemode]} {room} />
