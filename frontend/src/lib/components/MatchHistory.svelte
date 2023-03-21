<script lang="ts">
    import type { GameState } from "$lib/entities";
	import Match from "./Match.svelte";

	export let history: GameState[];
</script>

<div class="flex-col">
	{#each history as game (game.id)}
		<!-- TODO -->
		{#if game.roomId}
			<Match {game}/>
		{/if}
	{/each}
</div>
