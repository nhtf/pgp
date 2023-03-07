<script lang="ts">
	import { onMount } from "svelte";
	import { get } from "$lib/Web";
	import MatchHistory from "$lib/components/MatchHistory.svelte";

	let history = [];

	onMount(async () => {
		history = await get("/game/history");
	});
</script>

<MatchHistory history={history}/>
