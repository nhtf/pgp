<script lang="ts">
	import type { User } from "$lib/entities";
	import { Dropdown, DropdownHeader, DropdownItem, Search } from "flowbite-svelte";
	import { get } from "$lib/Web";
    import { createEventDispatcher } from "svelte";
	
	export let filter: (user: User) => boolean;
	export let value = "";

	const dispatch = createEventDispatcher();

	let users: User[] = [];
	let open = false;

	$: users;
	$: filtered = users.filter(filter);

	function onWindowClick(event: MouseEvent) {
		open = ((event.target as Element).id === "search")
	}

	function onDropdownClick(user: User) {
		value = user.username;
	}

	async function onInput() {
		dispatch("input");
	
		if (value.length) {
			users = await get(`/users`, { username: value, human: true });
		} else {
			users = [];
		}
	}

</script>

<!-- Manually trigger dropdown -->
<svelte:window on:click={onWindowClick}/>

<div>
	<Search
		size="lg"
		id="search"
		class="input"
		placeholder="username"
		bind:value
		on:input={onInput}
	/>
	{#if value}
		<Dropdown bind:open>
			{#if !filtered.length}
				<DropdownHeader>No users found</DropdownHeader>
			{/if}
			{#each filtered as user (user.id)}
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

<style>
	.user {
		align-items: center;
		display: flex;
		flex-direction: row;
		font-size: larger;
		gap: 1rem;
	}

</style>
