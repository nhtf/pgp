<script lang="ts">
	import type { User } from "$lib/entities";
	import { page } from "$app/stores";
	import { friendStore, inviteStore } from "$lib/stores";
	import { get, post } from "$lib/Web";
	import { Dropdown, DropdownHeader, DropdownItem, Search } from "flowbite-svelte";
	import { unwrap } from "$lib/Alert";
    import Swal from "sweetalert2";

	let users: User[] = [];
	let button: HTMLButtonElement;
	let open = false;
	let value = "";

	$: friendIds = [...$friendStore.keys()];
	$: invites = [...$inviteStore.values()];
	$: befriendable = users.filter(isBefriendable);

	function onWindowClick(event: MouseEvent) {
		open = ((event.target as Element).id === "search")
	}

	function onDropdownClick(user: User) {
		value = user.username;
		button.focus();
	}

	async function onInput() {
		users = await get(`/users`, { username: value, human: true });
	}

	async function befriend(username: string) {
		await unwrap(post(`/user/me/friends/request`, { username }));
	
		Swal.fire({	icon: "success", timer: 1000, showConfirmButton: false });
	}

	function isBefriendable(user: User) {
		return (
			user.id !== $page.data.user?.id &&
			!friendIds.includes(user.id) &&
			!invites.find((invite) => {
				invite.type === "FriendRequest" && invite.to.id === user.id
			})
		);
	}

</script>

<!-- Manually trigger dropdown -->
<svelte:window on:click={onWindowClick}/>

<div class="flex flex-row gap-1">
	<div>
	<Search
		size="lg"
		id="search"
		class="input search"
		placeholder="username"
		bind:value
		on:input={onInput}
	/>
	{#if value}
		<Dropdown bind:open>
			{#if !befriendable.length}
				<DropdownHeader>No users found</DropdownHeader>
			{/if}
			{#each befriendable as user (user.id)}
				<DropdownItem on:click={() => onDropdownClick(user)}>
					<div class="user">
						<img class="avatar" src={user.avatar} alt="" />
						<div>{user.username}</div>
					</div>
				</DropdownItem>
			{/each}
		</Dropdown>
	{/if}
	</div>
	<button
		class="button border-green"
		disabled={!value}
		bind:this={button}
		on:click={() => befriend(value)}>Add</button
	>
</div>

<style>
	.user {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		align-items: center;
		font-size: larger;
	}

</style>
