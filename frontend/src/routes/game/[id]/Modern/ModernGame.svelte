<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/stores";
	import { Modern } from "./Modern";
	import { GAME, levels } from "./Constants";

	let canvas: HTMLCanvasElement;
	
	let modern: Modern;

	//TODO implement powerups
	//TODO maybe add sound effects
	onMount(async () => {
		modern = new Modern(canvas, GAME.FOURPLAYERS);
		await modern.init();
		await modern.start({ room: $page.data.params.id, member: {user: $page.data.user, ...$page.data.member }});

		window.requestAnimationFrame(function render(time) {
			modern.update(time);
			window.requestAnimationFrame(render);
		});

	});

	onDestroy(() => {
		modern.stop();
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
