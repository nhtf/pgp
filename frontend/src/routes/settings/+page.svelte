<script>
	import { page } from '$app/stores';

	/** @type {import('./$types').PageData} */
	export let data;
</script>

<header>
</header>

<div class='item' id='settings'>
	<h1>Settings</h1>
</div>

<style>

.item {
	margin: 1em;
	background-color: white;
}

#settings {
	min-width: 30em;
	max-width: 100%;
	min-height: 50em;
	max-height: 100%;
	margin: 1em;
}
</style>
