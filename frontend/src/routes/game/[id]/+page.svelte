<script lang="ts">
    import type { PageData } from "./$types";
	import { Gamemode } from "$lib/enums";
    import { GAME } from "./Modern/Constants";
	import VrGame from "./VR/VrGame.svelte";
	import ClassicGame from "./Classic/ClassicGame.svelte";
    import ModernGame from "./Modern/ModernGame.svelte";
	import ModernGameShader from "./Modern/ModernGameShader.svelte";

	export let data: PageData;
</script>

<!-- //TODO make it possible to also select the 4 player option -->
{#if data.room.gamemode === Gamemode.VR}
	<VrGame />
{:else if data.room.gamemode === Gamemode.CLASSIC}
	<ClassicGame />
{:else if data.room.gamemode === Gamemode.MODERN && data.room.teams.length === 2}
<ModernGameShader />
	<!-- <ModernGame gameMode={GAME.TWOPLAYERS} /> -->
{:else}
	<ModernGame gameMode={GAME.FOURPLAYERS} />
{/if}