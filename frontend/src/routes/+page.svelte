<script lang="ts">
	import type { PageData } from "./$types";
    import Match from "$lib/components/Match.svelte";

	export let data: PageData;

	const games = data.games;

</script>

{#each games ?? [] as game (game.id)}
	<Match {game} />
{/each}
