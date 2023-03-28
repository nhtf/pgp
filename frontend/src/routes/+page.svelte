<script lang="ts">
	import type { PageData } from "./$types";
    import { friendStore, userStore } from "$lib/stores";
    import UserDropdown from "$lib/components/UserDropdown.svelte";
    import Match from "$lib/components/Match.svelte";

	export let data: PageData;

	$: users = [...$userStore.values()];
	$: friends = [...$friendStore.keys()].map((id) => $userStore.get(id)!);

</script>

<div class="users">
	{#each friends as user}
		<UserDropdown {user}/>
	{/each}
</div>

{#each data.games ?? [] as game (game.id)}
	<Match {game} />
{/each}

<style>
	.users {
		background-color: var(--box-color);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: 1rem;
		padding: 1rem;
		border-radius: 1rem;
		width: min-content;
	}

</style>