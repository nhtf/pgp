<script lang="ts">
    import { page } from '$app/stores';
	import type { PageData } from './$types';
	import Friends from "./friends.svelte";
	import Info from "./info.svelte";

	export let data: PageData;
</script>

<div class="block-container">
	<Info/>
	{#if data.user?.username === $page.params.username}
		<Friends/>
	{/if}
</div>
