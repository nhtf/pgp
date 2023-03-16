<script lang="ts">
	import type { Team, ChatRoom, GameRoom } from "$lib/entities";
	import { Gamemode } from "$lib/enums";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { unwrap } from "$lib/Alert";
	import { icon_path } from "$lib/constants";
	import { Access } from "$lib/enums";
	import { post, remove, patch } from "$lib/Web";
	import { userStore } from "$lib/stores";
	import Invite from "./Invite.svelte";
    import { byId } from "$lib/sorting";

	type T = ChatRoom & GameRoom;

	export let room: T;

	const crown = `${icon_path}/crown.svg`;
	const gamemode_icons = [
		`${icon_path}/pong-classic.svg`,
		`${icon_path}/vr.svg`,
		`${icon_path}/hexagon.svg`,
		`${icon_path}/hexagon4p.svg`,
	];

	const route = room.type.replace("Room", "").toLowerCase();
	const icon = (room.type === "GameRoom" ? 
		(room.gamemode === Gamemode.MODERN && room.teams?.length === 4 ? 
			gamemode_icons[3] : gamemode_icons[room.gamemode]) : null);

	let password = "";

	$: user = $userStore.get($page.data.user?.id)!;
	$: owner = room.owner ? $userStore.get(room.owner.id)! : null;

	async function join(room: T) {
		await unwrap(post(`/${route}/id/${room.id}/members`, { password }));

		password = "";
	}

	async function leave(room: T) {
		await unwrap(remove(`/${route}/id/${room.id}/members/me`));
	}
	
	async function erase(room: T) {
		await unwrap(remove(`/${route}/id/${room.id}`));
	}
	
	async function joinTeam(room: T, team: Team | null) {
		if (room.self?.player?.team?.id !== team?.id) {
			await unwrap(patch(`/${route}/id/${room.id}/team/${room.self?.id}`, { team: team?.id }));
		}

		await goto(`/${route}/${room.id}`);
	}

	async function lock(room: T) {
		await unwrap(post(`/game/id/${room.id}/lock`));
	}

</script>

<div class="room" style={`filter: brightness(${room.joined ? "100" : "80"}%)`}>
	{#if room.type === "ChatRoom"}
		<img class="avatar" src={owner?.avatar} alt="avatar"/>
	{/if}
	<div class="room-name">{room.name}</div>
	{#if room.type === "ChatRoom" && owner?.id === user.id}
		<img class="icon-owner" src={crown} alt="crown"/>
	{/if}
	{#if room.type === "GameRoom"}
		<img class="icon" src={icon} alt="icon"/>
	{/if}
	{#if room.access === Access.PROTECTED}
		<img class="icon" src={`${icon_path}/lock.svg`} alt="lock"/>
	{/if}
	<div class="grow"/>
	{#if room.joined}
		{#if owner?.id === user.id}
			<Invite {room}/>
			<button class="button border-red" on:click={() => erase(room)}>Delete</button>
			{#if room.type === "GameRoom"}
				<button class="button border-yellow" on:click={() => lock(room)}>Lock</button>
			{/if}
		{:else}
			<button class="button border-red" on:click={() => leave(room)}>Leave</button>
		{/if}
		{#if room.type !== "GameRoom" || room.teamsLocked}
			<a class="button border-blue" href={`/${route}/${room.id}`}>Enter</a>
		{:else}
			{#if !room.teamsLocked || room.self?.player === null}
				<button class="button border-blue" on:click={() => joinTeam(room, null)}>Spectate</button>
			{/if}
			{#if room.teams}
				{#each room.teams.sort(byId) as team (team.id)}
					{#if !room.teamsLocked || room.self?.player?.teamId === team.id}
						<button class="button border-blue" on:click={() => joinTeam(room, team)}>Join {team.name}</button>
					{:else}
						<a class="button border-blue" href={`/game/${room.id}`}>Enter</a>
					{/if}
				{/each}
			{/if}
		{/if}
	{:else}
		{#if room.access === Access.PROTECTED}
			<input class="input" placeholder="Password" type="password" bind:value={password}>
		{/if}
		<button class="button border-green" on:click={() => join(room)}>Join</button>
	{/if}
</div>

<style>
	.room {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		background: var(--box-color);
		border-radius: 1rem;
		padding: 1rem;
		flex-wrap: wrap;
	}

	.room-name {
		font-size: larger;
		margin-left: 1rem;
		align-self: center;
	}

	.icon-owner {
		width: 1.5rem;
		height: 1.5rem;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		align-self: center;
	}

</style>
