<script lang="ts">
    import { page } from "$app/stores";
	import type { User } from "$lib/entities";
    import { friendStore } from "$lib/stores";
    import { get } from "$lib/Web";
    import { Dropdown, Search } from "flowbite-svelte";

	let users: User[];
	let value = "";

	$: users = [];
	$: friendIds = [...$friendStore.keys()]
	$: befriendable = users.filter(({ id }) => id !== $page.data.user.id && !friendIds.includes(id));

	async function onInput() {
		users = await get(`/user/me/fuzzy`, { username: value }) ?? [];
	};

</script>

<Search class="input" bind:value on:input={onInput}/>
{#if value && befriendable.length}
	<Dropdown key={value}>
		{#each befriendable as user (user.id)}
			<div class="flex flex-row">
				<img class="avatar" src={user.avatar} alt=""/>
				<div>{user.username}</div>
			</div>
		{/each}
	</Dropdown>
{/if}