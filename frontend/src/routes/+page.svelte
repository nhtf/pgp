<script lang="ts">
	import MatchHistory from "$lib/components/MatchHistory.svelte";
    import type { PageData } from "./$types";

	export let data: PageData;
	
	const history = data.games;
</script>

{#if history}
	<MatchHistory {history}/>
{/if}
