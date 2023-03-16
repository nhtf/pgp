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

{#if data.room.gamemode === Gamemode.VR}
	<VrGame />
{:else if data.room.gamemode === Gamemode.CLASSIC}
	<ClassicGame />
{:else if data.room.gamemode === Gamemode.MODERN && data.room.teams.length === 2}
	<ModernGameShader gameMode={GAME.TWOPLAYERS} />
{:else}
	<ModernGameShader gameMode={GAME.FOURPLAYERS} />
{/if}