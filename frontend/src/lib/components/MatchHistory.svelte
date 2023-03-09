<script lang="ts">
    import type { Player } from "$lib/entities";
	import Match from "./Match.svelte";

	export let history: Player[];
</script>

<div class="match-history">
	{#each history as player}
		<Match {player}/>
	{/each}
</div>

<style>
	.match-history {
		display: flex;
		flex-direction: column;
	}
</style>
