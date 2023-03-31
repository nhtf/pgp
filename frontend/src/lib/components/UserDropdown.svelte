<script lang="ts">
    import type { Member, Room, User } from "$lib/entities";
    import { Avatar, Button, Dropdown, DropdownDivider, DropdownItem, Tooltip } from "flowbite-svelte";
    import { blockStore, friendStore, memberStore, userStore } from "$lib/stores";
    import { status_colors } from "$lib/constants";
    import { actions } from "$lib/action";
	import { page } from "$app/stores";
    import { Status } from "$lib/enums";
    import { get } from "$lib/Web";
    import Match from "./Match.svelte";

	// TODO: user not in store joins
	export let member: Member | undefined = undefined;
	export let user: User = $userStore.get(member!.userId)!
	export let room: Room | undefined = undefined;
	export let extend: boolean = false;

	$: me = $userStore.get($page.data.user?.id)!;
	$: user = $userStore.get(user.id)!;
	$: opacity = (user.status === Status.OFFLINE ? 50 : 100);

	$: member = member ? $memberStore.get(member.id)! : undefined;
	$: my_role = member ? findMember(me, { id: member.roomId } as Room)?.role : undefined;

	$: friendIds = [...$friendStore.keys()];
	$: blockedIds = [...$blockStore.keys()];

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

<Button color="alternative" class="friend-button opacity-{opacity} w-full">
	<Avatar
		src={user.avatar}
		id="avatar-{user.id}"
		dot={{
			placement: "bottom-right",
			color: status_colors[user.status],
		}}
	/>
	<Tooltip>{user.username}</Tooltip>
	{#if extend}
		<div>{user.username}</div>
	{/if}
</Button>
<Dropdown class="dropdown">
	<DropdownItem class="dropdown-item">
		<a href={`/profile/${encodeURIComponent(user.username)}`}>Profile</a>
	</DropdownItem>
	{#if user.id !== me.id}
		<DropdownDivider/>
		{#each actions as { condition, fun }}
			{#if !condition || condition({ user, member, friendIds, blockedIds, my_role }) }
				<DropdownItem class="dropdown-item" on:click={() => fun({ user, member, room })}>{capitalize(fun.name)}</DropdownItem>
			{/if}
		{/each}
	{/if}
</Dropdown>
{#if extend && user.activeRoomId}
	{#await get(`/game/${user.activeRoomId}/state`) then game}
		<Match {game}/>
	{/await}
{/if}