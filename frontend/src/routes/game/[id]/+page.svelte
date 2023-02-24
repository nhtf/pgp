<script lang="ts">
	import VrGame from "./VR/VrGame.svelte";
	import ClassicGame from "./Classic/ClassicGame.svelte";
	import { Gamemode } from "$lib/enums";
    import type { PageData } from "./$types";
    import ModernGame from "./Modern/ModernGame.svelte";
    import { GAME } from "./Modern/Constants";

	export let data: PageData;
</script>

<!-- //TODO make it possible to also select the 4 player option -->
{#if data.room.gamemode === Gamemode.VR}
	<VrGame />
{:else if data.room.gamemode === Gamemode.CLASSIC}
	<ClassicGame />
{:else if data.room.gamemode === Gamemode.MODERN}
	<ModernGame gameMode={GAME.TWOPLAYERS} />
{:else}
	<ModernGame gameMode={GAME.FOURPLAYERS} />
{/if}