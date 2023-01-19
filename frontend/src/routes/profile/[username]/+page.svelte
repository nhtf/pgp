<script lang="ts">
	import type { PageData } from './$types';
	import Friends from "./friends.svelte";
	import Info from "./info.svelte";

	export let data: PageData;
</script>

<div class="block_container">
	<Info data={data}/>
	{#if data.friends}
	<Friends data={data}></Friends>
	{/if}
</div>
