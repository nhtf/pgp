<script lang="ts">
	import MatchHistory from "$lib/components/MatchHistory.svelte";

	export let data;
	
	$: history = data.players;
</script>

<MatchHistory {history}/>
