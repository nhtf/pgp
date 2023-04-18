<script lang="ts">
	import { Game, User, type Member, type Room } from "$lib/entities";
	import { Avatar, Dropdown, DropdownDivider, DropdownItem, Popover, Tooltip } from "flowbite-svelte";
	import { blockStore, friendStore, gameStore, memberStore, updateStore, userStore } from "$lib/stores";
	import { status_colors } from "$lib/constants";
	import { actions } from "$lib/action";
	import { Status } from "$lib/enums";
	import { page } from "$app/stores";
	import { onMount } from "svelte";
    import { get } from "$lib/Web";
	import Match from "./Match.svelte";

	export let member: Member | undefined = undefined;
	export let user: User = $userStore.get(member!.userId)!
	export let room: Room | undefined = undefined;
	export let extend: boolean = false;
	export let banned: boolean = false;
	export let placement: string = "bottom";
	export let key: number = 0;

	$: me = $userStore.get($page.data.user?.id)!;
	$: user = $userStore.get(user.id)!;
	$: opacity = (user.status === Status.OFFLINE ? 50 : 100);

	$: member = member ? $memberStore.get(member.id)! : undefined;
	$: my_role = member ? findMember(me, { id: member.roomId } as Room)?.role : undefined;

	$: friendIds = [...$friendStore.keys()];
	$: blockedIds = [...$blockStore.keys()];

	$: game = user.activeRoomId ? fetchGame(user) : undefined;

	onMount(async () => {
		if (user.activeRoomId && !game) {
			const game: Game = await get(`/game/${user.activeRoomId}/state`);
			const users = game.teams.map((team) => team.players).flat().map((player) => player.user);

			updateStore(Game, game);
			updateStore(User, users);
		}
	});

	function fetchGame(user: User) {
		const cached = [...$gameStore.values()].find((game) => game.roomId === user.activeRoomId);
		
		if (!game) {
			(async () => {
				const game: Game = await get(`/game/${user.activeRoomId}/state`);
				const users = game.teams.map((team) => team.players).flat().map((player) => player.user);

				updateStore(Game, game);
				updateStore(User, users);
			})();
		}

		return cached;
	}

	function findMember(user: User, room: Room) {
		return [...$memberStore.values()].find(isMember.bind({}, user, room));
	}

	function isMember(user: User, room: Room, member: Member) {
		return member.userId === user.id && member.roomId === room.id
	}

	function capitalize(name: string) {
		return `${name.slice(0, 1).toUpperCase()}${name.slice(1).toLowerCase()}`
	}

</script>

<div class="user">
	<Avatar
		class="opacity-{opacity}"
		src={user.avatar}
		id="avatar-{user.id}-{key}"
		dot={{
			placement: "bottom-right",
			color: status_colors[user.status],
		}}
	/>
	<Tooltip>{user.username}</Tooltip>
	{#if game}
		<Popover {placement} class="popover" triggeredBy="#avatar-{user.id}-{key}">
			<Match {game} {user}/>
		</Popover>
	{/if}
	{#if extend}
		<div>{user.username}</div>
	{/if}
	<Dropdown {placement} class="dropdown" triggeredBy="#avatar-{user.id}-{key}">
		<DropdownItem class="dropdown-item">
			<a href={`/profile/${encodeURIComponent(user.username)}`}>Profile</a>
		</DropdownItem>
		{#if user.id !== me.id}
			<DropdownDivider/>
			{#each actions as { condition, fun }}
				{#if !condition || condition({ user, member, friendIds, blockedIds, my_role, banned }) }
					<DropdownItem class="dropdown-item" on:click={() => fun({ user, member, room })}>{capitalize(fun.name)}</DropdownItem>
				{/if}
			{/each}
		{/if}
	</Dropdown>
</div>

<style>
	.user {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1rem;
		margin: 0.5rem;
	}

</style>
