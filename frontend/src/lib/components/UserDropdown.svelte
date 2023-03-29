<script lang="ts">
    import type { Member, Room, User } from "$lib/entities";
    import { Avatar, Dropdown, DropdownDivider, DropdownItem, Tooltip } from "flowbite-svelte";
    import { blockStore, friendStore, memberStore, userStore } from "$lib/stores";
    import { status_colors } from "$lib/constants";
    import { actions } from "$lib/action";
	import { page } from "$app/stores";

	export let member: Member | undefined = undefined;
	export let user: User = { id: member!.userId } as User;
	export let extend: boolean = false;

	$: me = $userStore.get($page.data.user?.id)!;
	$: user = $userStore.get(user.id)!;

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

<div class="user">
	<Avatar
		src={user?.avatar}
		id="avatar-{user.id}"
		dot={{
			placement: "bottom-right",
			color: status_colors[user.status],
		}}
	/>
	<Tooltip>{user.username}</Tooltip>
	<Dropdown triggeredBy="#avatar-{user.id}" class="dropdown">
		<DropdownItem class="dropdown-item">
			<a href={`/profile/${encodeURIComponent(user.username)}`}>Profile</a>
		</DropdownItem>
		{#if user.id !== me.id}
			<DropdownDivider/>
			{#each actions as { condition, fun }}
				{#if !condition || condition({ user, member, friendIds, blockedIds, my_role }) }
					<DropdownItem class="dropdown-item" on:click={() => fun({ user, member })}>{capitalize(fun.name)}</DropdownItem>
				{/if}
			{/each}
		{/if}
	</Dropdown>
	{#if extend}
		<div>{user.username}</div>
	{/if}
</div>

<style>

	.user {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1rem;
	}

</style>