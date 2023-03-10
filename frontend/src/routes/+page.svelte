<script lang="ts">
	import MatchHistory from "$lib/components/MatchHistory.svelte";

	export let data;
	
	const history = data.games;
</script>

<MatchHistory {history}/>
