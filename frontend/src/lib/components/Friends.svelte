<script lang="ts">
	import { friendStore, userStore } from "$lib/stores";
    import { byStatusThenName } from "$lib/sorting";
    import UserDropdown from "./UserDropdown.svelte";
    import UserSearch from "./UserSearch.svelte";
	import Friend from "./Friend.svelte";

	$: friends = [...$friendStore.keys()]
		.map((id) => $userStore.get(id)!)
		.sort(byStatusThenName);

</script>

<div class="block-cell self-flex-start bg-c bordered" id="friend-block">
	<div class="block-hor">
		<UserSearch/>
	</div>
	<div class="block-vert width-available">
		{#each friends as user (user.id)}
			<Friend {user} />
		{/each}
	</div>
</div>

<div class="flex flex-col gap-4">
	{#each friends as user (user.id)}
		<UserDropdown {user}/>
	{/each}
</div>

<style>
	.width-available {
		width: -moz-available;
		width: -webkit-fill-available;
	}

	#friend-block {
		height: 100%;
	}

	.block-vert {
		flex-grow: 0.1;
		padding: 0;
		border: 0;
		height: 100%;
	}

	.block-cell {
		flex-direction: column;
		min-width: 100px;
		min-height: 40px;
		padding: 5px;
	}

	.block-cell:first-child {
		flex-grow: 1;
		text-align: center;
	}

	.self-flex-start {
		align-self: flex-start;
	}
</style>
