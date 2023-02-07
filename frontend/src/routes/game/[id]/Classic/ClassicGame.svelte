<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { Classic } from "./Classic";

	let canvas: HTMLCanvasElement;

	//TODO cap the speed of the ball

	onMount(async () => {
		const classic = new Classic(canvas);

		console.log(classic);

		await classic.start({ room: $page.data.params.id, user: $page.data.user });

		window.requestAnimationFrame(function render(time) {
			classic.update(time);
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
</style>
