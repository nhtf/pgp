<script lang="ts">
	import type { PageData } from "./$types";
	import Match from "$lib/components/Match.svelte";

	export let data: PageData;
</script>

{#each data.games ?? [] as game (game.id)}
	<Match {game} />
{/each}
