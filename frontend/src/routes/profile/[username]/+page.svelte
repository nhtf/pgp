<script lang="ts">
	import type { PageData } from './$types';
	import Friends from "$lib/components/Friends.svelte";
	import Info from "$lib/components/Info.svelte";

	export let data: PageData;

</script>

<div class="block-container">
	<Info/>
	{#if data.user?.id === data.profile.id}
		<Friends/>
	{/if}
</div>
