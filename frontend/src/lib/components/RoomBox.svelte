<script lang="ts">
	import type { ChatRoom, GameRoom, GameState } from "$lib/entities";
	import {  Gamemode } from "$lib/enums";
	import { page } from "$app/stores";
	import { unwrap } from "$lib/Alert";
	import { icon_path } from "$lib/constants";
	import { Access } from "$lib/enums";
	import { post, remove, patch, get } from "$lib/Web";
	import { gameStateStore, userStore } from "$lib/stores";
	import Invite from "./Invite.svelte";
    import Swal from "sweetalert2";

	type T = ChatRoom | GameRoom;

	export let room: T;

	const crown = `${icon_path}/crown.svg`;
	const gamemode_icons = [
		`${icon_path}/pong-classic.svg`,
		`${icon_path}/vr.svg`,
		`${icon_path}/hexagon.svg`,
		`${icon_path}/hexagon4p.svg`,
	];

	const route = room.type.replace("Room", "").toLowerCase();

	let password = "";
	let state: GameState | null = (room as GameRoom).state ?? null;
	let icon: string | null = null;
	
	if (room.type === "GameRoom") {
		icon = gamemode_icons[state.gamemode];

		if (state.gamemode === Gamemode.MODERN && state.teams?.length === 4) {
			icon = gamemode_icons[3]
		}
	} 

	$: user = $userStore.get($page.data.user?.id)!;
	$: owner = room.owner ? $userStore.get(room.owner.id)! : null;
	$: state = state ? $gameStateStore.get(state.id)! : null;

	$: team = state?.teams.find((team) => team.players?.map((player) => player.userId).includes(user.id));

	function teamSelector(room: T): Promise<number | null> {
		const inputOptions = state!.teams.reduce((acc, team) => { return { ...acc, [team.id]: team.name } }, { "0": "spectate" });
		const promise = Swal.fire({
			input: "radio",
			inputOptions,
			confirmButtonText: "Join",
			showCancelButton: true,
			width: "auto",
		}).then(({ isConfirmed, value }) => {
			if (!isConfirmed) {
				throw new Error("No team selected");
			}
		
			return value > 0 ? value : null;
		});

		const elements = document.getElementsByName("swal2-radio") as NodeListOf<HTMLInputElement>;
		const element = [...elements].find((element) => Number(element.value) === (team?.id ?? 0))!;

		element.checked = true;
	
		return promise;
	}

	async function join(room: T) {

		await unwrap(post(`/${route}/id/${room.id}/members`, { password }));
	
		if (room.type === "GameRoom" && !(room as GameRoom).state.teamsLocked) {
			changeTeam(room);
		}
	
		password = "";
	}

	async function leave(room: T) {
		await unwrap(remove(`/${route}/id/${room.id}/members/me`, { ban: false }));
	}
	
	async function erase(room: T) {
		await unwrap(remove(`/${route}/id/${room.id}`));
	}
	
	async function changeTeam(room: T) {
		try {
			const teamId = await teamSelector(room);
		
			await unwrap(patch(`/game/id/${room.id}/team/${room.self!.id}`, { team: teamId }));
			
		} catch (_) {}
	}

	async function lock(room: T) {
		await unwrap(post(`/game/id/${room.id}/lock`));
	}

</script>

<div class="room" style={`filter: brightness(${room.joined ? "100" : "80"}%)`}>
	{#if room.type === "ChatRoom"}
		<img class="avatar" src={owner?.avatar} alt="avatar"/>
	{:else}
		<img class="icon" src={icon} alt="icon"/>
	{/if}
	<div class="room-name">{room.name}</div>
	{#if owner?.id === user.id}
		<img class="icon-owner" src={crown} alt="crown" title="You are the owner of this room"/>
	{/if}
	<div class="grow"/>
	{#if room.joined}
		{#if owner?.id === user.id}
			<Invite {room}/>
			<button class="button border-red" on:click={() => erase(room)}>Delete</button>
			{#if room.type === "GameRoom" && !state?.teamsLocked}
				<button class="button border-yellow" on:click={() => lock(room)}>Lock teams</button>
			{/if}

			<!-- TODO: remove -->
			{#if room.type === "GameRoom" && state?.teamsLocked}
				<button class="button border-yellow" on:click={() => get(`/debug/unlock`, { id: room.id })}>Unlock</button>
			{/if}

		{:else}
			<button class="button border-red" on:click={() => leave(room)}>Leave</button>
		{/if}
		{#if state && !state.teamsLocked}
			<button class="button border-yellow" on:click={() => changeTeam(room)}>Change team</button>
		{/if}
		<a class="button border-blue" href={`/${route}/${room.id}`}>{room.type === "ChatRoom" ? "Enter" : team ? `Play as ${team.name}` : "Spectate"}</a>
	{:else}
		{#if room.access === Access.PROTECTED}
			<input class="input" placeholder="Password" type="password" bind:value={password}>
		{/if}
		<button class="button border-green" on:click={() => join(room)}>Join</button>
	{/if}
</div>

<style>
	.room-name {
		font-size: larger;
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
