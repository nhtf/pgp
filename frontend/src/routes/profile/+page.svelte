<script lang="ts">
    import { onMount } from "svelte";

	/** @type {import('./$types').PageLoad} */

	interface ResultDTO {
	id: number;
	username: string;
	}
	export let data:ResultDTO;

	onMount(async () => {
		window.location.href = '/profile/' + data.username;
	});
</script>
