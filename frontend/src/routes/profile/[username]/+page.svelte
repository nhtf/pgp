<script lang="ts">
	import type { PageData } from './$types';
	import Friends from "./friends.svelte";
	import Info from "./info.svelte";

	export let data: PageData;
</script>

<div class="block-container">
	<Info/>
	{#if data.self}
		<Friends/>
	{/if}
</div>
