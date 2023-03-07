<script lang="ts">
	import Match from "./Match.svelte";

	export let history;
</script>

<div class="match-history">
	{#each history as player}
		<Match player={player}/>
	{/each}
</div>

<style>
	.match-history {
		display: flex;
		flex-direction: column;
	}
</style>
