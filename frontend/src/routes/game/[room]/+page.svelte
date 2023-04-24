<script lang="ts">
	import type { PageData } from "./$types";
	import { GameRoom, User, type Team, Game, GameRoomMember } from "$lib/entities";
    import { scoreColors } from "./Modern/Constants";
    import { gameStore, updateStore } from "$lib/stores";
	import { Gamemode } from "$lib/enums";
    import { byId } from "$lib/sorting";
    import { page } from "$app/stores";
	import ModernGameShader from "./Modern/ModernGameShader.svelte";
	import RoomHeader from "$lib/components/RoomHeader.svelte";
	import ClassicGame from "./Classic/ClassicGame.svelte";
	import VrGame from "./VR/VrGame.svelte";

	export let data: PageData;

	updateStore(User, data.users);
	updateStore(GameRoom, data.room);
	updateStore(Game, data.room.state!);
	updateStore(GameRoomMember, data.members);

	const room = data.room;
	const gamemode = room.state!.gamemode;
	const components = [ClassicGame, VrGame, ModernGameShader];

	$: team = [...$gameStore.values()]
		.find((game) => game.roomId === room.id)?.teams
		.find((team) => team.players?.some(({ userId }) => userId === $page.data.user.id));

	function getTeamColor(team: Team) {
		const index = room.state?.teams.sort(byId).findIndex((teamRoom) => teamRoom.id === team?.id);
		const modernColor = index !== undefined && index >= 0 ? scoreColors[1][index].cs : undefined;
	
		return (gamemode === Gamemode.MODERN && team !== undefined && index !== undefined) ? modernColor : "white";
	}

</script>

<div class="page">
	{#if gamemode !== Gamemode.VR}
		<RoomHeader {room} />
		{#if team}
			<div class="room justify-center" style="color: {getTeamColor(team)}">{team.name}</div>
		{:else}
			<div class="room justify-center">Spectator</div>
		{/if}
	{/if}

	<svelte:component this={components[gamemode]} {room} />
</div>