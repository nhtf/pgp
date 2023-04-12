<script lang="ts">
    import type { Member, Room, User } from "$lib/entities";
    import { Avatar, Dropdown, DropdownDivider, DropdownItem, Popover, Tooltip } from "flowbite-svelte";
    import { blockStore, friendStore, gameStore, memberStore, updateStore, userStore } from "$lib/stores";
    import { status_colors } from "$lib/constants";
    import { actions } from "$lib/action";
    import { Status } from "$lib/enums";
	import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { get } from "$lib/Web";
    import Match from "./Match.svelte";
    import { fetchGame } from "$lib/util";

	export let member: Member | undefined = undefined;
	export let user: User = $userStore.get(member!.userId)!
	export let room: Room | undefined = undefined;
	export let extend: boolean = false;
	export let banned: boolean = false;

	$: me = $userStore.get($page.data.user?.id)!;
	$: user = $userStore.get(user.id)!;
	$: opacity = (user.status === Status.OFFLINE ? 50 : 100);

	$: member = member ? $memberStore.get(member.id)! : undefined;
	$: my_role = member ? findMember(me, { id: member.roomId } as Room)?.role : undefined;

	$: friendIds = [...$friendStore.keys()];
	$: blockedIds = [...$blockStore.keys()];

	$: game = [...$gameStore.values()].find((game) => game.roomId === user.activeRoomId);

	onMount(async () => {
		if (user.activeRoomId) {
			await fetchGame(user.activeRoomId);
		}
	});

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

<div class="user opacity-{opacity}">
	<Avatar
		src={user.avatar}
		id="avatar-{user.id}"
		dot={{
			placement: "bottom-right",
			color: status_colors[user.status],
		}}
	/>
	<Tooltip>{user.username}</Tooltip>
	{#if game}
		<Popover placement="bottom">
			<Match {game} {user}/>
		</Popover>
	{/if}
	{#if extend}
		<div>{user.username}</div>
	{/if}
	<Dropdown class="dropdown" triggeredBy="#avatar-{user.id}">
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