<script lang="ts">
	import type { PageData } from "./$types";
	import Match from "$lib/components/Match.svelte";
    import UserSearch from "$lib/components/UserSearch.svelte";

	export let data: PageData;
</script>

<UserSearch/>

{#if data.games}
	{#each data.games as game (game.id)}
		<Match {game} />
	{/each}
{/if}
