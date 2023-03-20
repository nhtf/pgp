<script lang="ts">
    import type { PageData } from "./$types";
    import type { UpdatePacket } from "$lib/types";
	import { Action, Gamemode, Subject } from "$lib/enums";
    import { GAME } from "./Modern/Constants";
    import { onDestroy, onMount } from "svelte";
    import { updateManager } from "$lib/updateSocket";
    import { goto } from "$app/navigation";
	import ClassicGame from "./Classic/ClassicGame.svelte";
	import VrGame from "./VR/VrGame.svelte";
	import ModernGameShader from "./Modern/ModernGameShader.svelte";

	export let data: PageData;

	const gamemode = data.room.state.gamemode;

	let index: number;

	onMount(() => {
		index = updateManager.set(Subject.ROOM, async (update: UpdatePacket) => {
			if (update.id === data.room.id && update.action === Action.REMOVE) {
				await goto(`/game`);
			}
		})
	});

	onDestroy(() => {
		updateManager.remove(index);
	});

</script>

{#if gamemode === Gamemode.VR}
	<VrGame />
{:else if gamemode === Gamemode.CLASSIC}
	<ClassicGame />
{:else if gamemode === Gamemode.MODERN && data.room.state.teams.length === 2}
	<ModernGameShader gameMode={GAME.TWOPLAYERS} />
{:else}
	<ModernGameShader gameMode={GAME.FOURPLAYERS} />
{/if}