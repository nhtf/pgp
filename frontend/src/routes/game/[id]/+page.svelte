<script lang="ts">
	import VrGame from "./VrGame.svelte";
	import ClassicGame from "./ClassicGame.svelte";
	import { Gamemode } from "$lib/types";
    import type { PageData } from "./$types";

	export let data: PageData;
</script>

{#if data.room.gamemode === Gamemode.VR}
	<VrGame />
{:else}
	<ClassicGame />
{/if}
