<script lang="ts">
	import type { User } from "$lib/entities";
	import { Dropdown, DropdownHeader, DropdownItem, Search } from "flowbite-svelte";
	import { get } from "$lib/Web";
    import { createEventDispatcher } from "svelte";
	
	export let filter: (user: User) => boolean = () => true;
	export let value = "";

	const dispatch = createEventDispatcher();

	let users: User[] = [];
	let open = false;

	$: filtered = users.filter(filter);

	function onWindowClick(event: MouseEvent) {
		open = ((event.target as Element).id === "search")
	}

	function onDropdownClick(user: User) {
		value = user.username;
		document.getElementById("search")?.focus();
		//[...document.getElementsByClassName("search-input")]?[0].focus();
	}

	function onKeyDown(event: KeyboardEvent) {
		if (users.length !== 0 && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
			const current = document.activeElement as HTMLElement;
			const items = [...document.getElementsByClassName("search-item")] as HTMLElement[];
			let idx = items.indexOf(current);
			console.log(idx);

			if (idx < 0) {
				idx = 0;
			} else {
				if (event.key === "ArrowUp")
					idx = (idx + items.length - 1) % users.length;
				else
					idx = (idx + 1) % users.length;
			}
			current.blur()
			items[idx].focus();
			//console.log("should do something");
		}
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
		class="input search-input"
		placeholder="username"
		bind:value
		on:input={onInput}
		on:keydown={onKeyDown}
	/>
	{#if value}
		<Dropdown bind:open>
			{#if !filtered.length}
				<DropdownHeader>No users found</DropdownHeader>
			{/if}
			{#each filtered as user (user.id)}
				<DropdownItem class="search-item" on:click={() => onDropdownClick(user)} on:keydown={onKeyDown}>
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
