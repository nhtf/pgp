<script lang="ts">
	import type { Team } from "$lib/entities";
	import type { PageData } from "./$types";
    import { scoreColors } from "./Modern/Constants";
    import { gameStore } from "$lib/stores";
	import { Gamemode } from "$lib/enums";
    import { byId } from "$lib/sorting";
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

	function getTeamColor(team: Team) {
		const index = room.state?.teams.sort(byId).findIndex((teamRoom) => teamRoom.id === team?.id);
		const modernColor = index ? scoreColors[1][index].cs : undefined;
	
		return (gamemode === Gamemode.MODERN && team !== undefined && index !== undefined) ? modernColor : "white";
	}

</script>

{#if gamemode !== Gamemode.VR}
	<RoomHeader {room} />
	{#if team}
		<div class="room justify-center" style="color: {getTeamColor(team)}">{team.name}</div>
	{/if}
{/if}

<svelte:component this={components[gamemode]} {room} />
