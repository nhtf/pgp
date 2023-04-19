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

<div>
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	canvas {
		position: fixed!important;
		inset: 225px 5px 5px 5px!important;
		border-radius: 6px!important;
		height: calc(100vh - 230px);
		width: calc(100vw - 10px);
	}
</style>
