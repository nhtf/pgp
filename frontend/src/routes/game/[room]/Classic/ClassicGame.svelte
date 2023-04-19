<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Classic } from "./Classic";
	import { Shader } from "./Shader";
    import type { GameRoom } from "$lib/entities";

	export let room: GameRoom;

	let canvas: HTMLCanvasElement;
	let classic: Classic;
	let frame: number;

	onMount(async () => {
		const shader = new Shader(canvas);
		classic = new Classic(shader.getCanvas());
		console.log(classic);
		shader.addEventListener(classic);

		await classic.start({
			room,
			member: { ...room.self!	},
		});

		frame = window.requestAnimationFrame(function render(time) {
			classic.update(time);
			shader.update(time);
			frame = window.requestAnimationFrame(render);
		});
	});

	onDestroy(() => {
		classic?.stop();
		cancelAnimationFrame(frame);
	});
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		position: fixed!important;
		inset: 215px 5px 5px 5px!important;
		border-radius: 6px!important;
		height: calc(100vh - 225px);
		width: calc(100vw - 10px);
	}
</style>
