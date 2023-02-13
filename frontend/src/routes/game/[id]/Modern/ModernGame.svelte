<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { Modern } from "./Modern";

	let canvas: HTMLCanvasElement;

	//TODO try and make it possible to have 2 or 4 players , and depending on that the field adjusts
	//TODO also implement powerups
	//TODO add sound effects
	onMount(async () => {
		const modern = new Modern(canvas);

		await modern.start({ room: $page.data.params.id, user: $page.data.user });

		window.requestAnimationFrame(function render(time) {
			modern.update(time);
			window.requestAnimationFrame(render);
		});
	});
</script>


<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		position: fixed;
		height: calc(100vh - 82px);
		width: calc(100vw - 10px);
		inset: 77px 5px 5px 5px;
		border-radius: 6px;
	}

	canvas:hover {
		cursor: none;
	}
</style>
