<script lang="ts">
	import VrGame from "./VR/VrGame.svelte";
	import ClassicGame from "./Classic/ClassicGame.svelte";
	import { Gamemode } from "$lib/types";
    import type { PageData } from "./$types";
    import ModernGame from "./Modern/ModernGame.svelte";

	export let data: PageData;
</script>

{#if data.room.gamemode === Gamemode.VR}
	<VrGame />
{:else if data.room.gamemode === Gamemode.REGULAR}
<!-- For testing Moderngame because backend doesn't allow more modes -->
	<ModernGame />
	<!-- <ClassicGame /> -->
{:else}
	<ModernGame />
{/if}
