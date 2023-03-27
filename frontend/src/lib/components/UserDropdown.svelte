<script lang="ts">
    import type { Member, Room, User } from "$lib/entities";
    import type { Role } from "$lib/enums";
    import { status_colors } from "$lib/constants";
    import { blockStore, friendStore, memberStore, userStore } from "$lib/stores";
    import { Avatar, Dropdown, DropdownDivider, DropdownItem, Tooltip } from "flowbite-svelte";
    import { get, patch, post, remove } from "$lib/Web";
    import { unwrap } from "$lib/Alert";
	import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import Swal from "sweetalert2";
    import { actions } from "$lib/action";

	export let user: User;
	export let room: Room | null = null;

	let member: Member | undefined;

	$: me = $userStore.get($page.data.user?.id)!;
	$: user = $userStore.get(user.id)!;

	$: member = room ? findMember(user, room) : undefined;
	$: my_role = room ? findMember(me, room).role : undefined;

	$: friendIds = [...$friendStore.keys()];
	$: blockedIds = [...$blockStore.keys()];

	function findMember(user: User, room: Room) {
		return [...$memberStore.values()].find(isMember.bind({}, user, room))!;
	}

	function isMember(user: User, room: Room, member: Member) {
		return member.userId === user.id && member.roomId === room.id
	}

	function capitalize(name: string) {
		return `${name.slice(0, 1).toUpperCase()}${name.slice(1).toLowerCase()}`
	}

</script>

{JSON.stringify(blockedIds)}
<Avatar
	src={user.avatar}
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
	<DropdownDivider/>
	<!-- {#if !friendIds.includes(user.id)}
		<DropdownItem class="dropdown-item" on:click={() => befriend(user)}>Befriend</DropdownItem>
	{:else}
		<DropdownItem class="dropdown-item" on:click={() => unfriend(user)}>Unfriend</DropdownItem>
	{/if}
	{#if !blockedIds.includes(user.id)}
		<DropdownItem class="dropdown-item" on:click={() => block(user)}>Block</DropdownItem>
	{:else}
		<DropdownItem class="dropdown-item" on:click={() => unblock(user)}>Unblock</DropdownItem>
	{/if} -->
	{#each actions as { fun, condition }}
		{#if !condition || condition(user, member)}
			<DropdownItem class="dropdown-item" on:click={() => fun(user, member)}>{capitalize(fun.name)}</DropdownItem>
		{/if}
	{/each}

</Dropdown>
