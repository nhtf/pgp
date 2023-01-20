<script lang="ts">
    import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import Friends from "./friends.svelte";
	import Info from "./info.svelte";

	export let data: PageData;

	onMount(() => {
		data = data;
	});
</script>

<div class="block_container">
	<Info data={data}/>
	{#if data.friendlist}
	<Friends data={data}></Friends>
	{/if}
</div>
