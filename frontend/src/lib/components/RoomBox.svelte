<script lang="ts">
	import type { Room } from "$lib/entities";
	import { gameStore, roomStore, userStore } from "$lib/stores";
	import { post, remove, patch, put } from "$lib/Web";
	import { icon_path } from "$lib/constants";
	import { unwrap } from "$lib/Alert";
	import { Access, Role } from "$lib/enums";
    import { byId } from "$lib/sorting";
	import { page } from "$app/stores";
	import InviteBox from "./InviteBox.svelte";
    import Swal from "sweetalert2";

	export let room: Room;

	const crown = `${icon_path}/crown.svg`;

	let password = "";

	$: room = $roomStore.get(room.id)!;
	$: user = $userStore.get($page.data.user?.id)!;
	$: owner = room.owner ? $userStore.get(room.owner.id)! : undefined;

	$: state = [...$gameStore.values()].find((game) => game.roomId === room.id);
	$: team = state?.teams.find((team) => team.players?.some(({ userId }) => userId === user.id));

	function teamSelector(): Promise<number | null | undefined> {
		const inputOptions = state!.teams
			.sort(byId)
			.reduce((acc, team) => {
				return { ...acc, [team.id]: team.name }
			}, { "0": "spectate" });
		
		const promise = Swal.fire({
			input: "radio",
			inputOptions,
			confirmButtonText: "Join",
			showCancelButton: true,
			width: "auto",
		}).then(({ isConfirmed, value }) => {
			if (!isConfirmed)
				return undefined;
			return value > 0 ? value : null;
		});

		const elements = document.getElementsByName("swal2-radio") as NodeListOf<HTMLInputElement>;
		const element = [...elements].find((element) => Number(element.value) === (team?.id ?? 0))!;

		element.checked = true;
	
		return promise;
	}

	async function join(room: Room) {
		await unwrap(post(`${room.route}/members`, { password }));

		if (room.type === "GameRoom" && state && !state.teamsLocked) {
			changeTeam(room);
		}
	
		password = "";
	}

	async function leave(room: Room) {
		await unwrap(remove(`${room.route}/members/me`, { ban: false }));
	}
	
	async function erase(room: Room) {
		await unwrap(remove(room.route));
	}
	
	async function changeTeam(room: Room) {
		const team = await teamSelector();

		if (team !== undefined) {
			await unwrap(patch(`${room.route}/team/${room.self!.id}`, { team }));
		}
	}

	async function lock(room: Room) {
		await unwrap(put(`${room.route}/lock`));
	}

	function enterText(room: Room) {
		switch (room.type) {
			case "ChatRoom":
				return "Enter"
			case "GameRoom":
				return team ? `Play as ${team.name}` : "Spectate";
		}
	}

</script>

<div class="room" style={`opacity: ${room.joined ? "100" : "50"}%`}>
	{#if room.type === "ChatRoom"}
		<img class="avatar" src={owner?.avatar} alt="avatar"/>
	{:else if room.icon}
		<img class="icon" src={room.icon} alt="icon"/>
	{/if}
	<div class="text-lg">{room.name}</div>
	{#if owner?.id === user.id}
		<img class="icon-owner" src={crown} alt="crown" title="You are the owner of this room"/>
	{/if}
	<div class="grow"/>
	{#if room.joined}
		{#if room.self && room.self.role >= Role.ADMIN}
			<InviteBox {room}/>
		{/if}
		{#if owner?.id === user.id}
			<button class="button border-red" on:click={() => erase(room)}>Delete</button>
			{#if room.type === "GameRoom" && state && !state.teamsLocked}
				<button class="button border-yellow" on:click={() => lock(room)}>Lock teams</button>
			{/if}

		{:else}
			<button class="button border-red" on:click={() => leave(room)}>Leave</button>
		{/if}
		{#if state && !state.teamsLocked}
			<button class="button border-yellow" on:click={() => changeTeam(room)}>Change team</button>
		{/if}
		{#key team}
			<a class="button border-blue" href={room.route}>{enterText(room)}</a>
		{/key}
	{:else}
		{#if room.access === Access.PROTECTED}
			<input class="input" placeholder="Password" type="password" bind:value={password}>
		{/if}
		<button class="button border-green" on:click={() => join(room)}>Join</button>
	{/if}
</div>

<style>
	.icon-owner {
		width: 1.5rem;
		height: 1.5rem;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		align-self: center;
	}

</style>
