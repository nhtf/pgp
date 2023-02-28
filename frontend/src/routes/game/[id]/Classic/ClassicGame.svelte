<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/stores";
	import { Classic } from "./Classic";
	import { Shader } from "../Shader";

	let canvas: HTMLCanvasElement;

	//TODO cap the speed of the ball

	let classic: Classic;
	let frame: number;

	onMount(async () => {
		const shader = new Shader(canvas);
		classic = new Classic(shader.getCanvas());
		shader.addEventListener(classic);

		console.log($page.params);
		await classic.start({
			room: $page.params.id,
			member: {
				user: $page.data.user,
				...$page.data.member,
			},
		});

		frame = window.requestAnimationFrame(function render(time) {
			classic.update(time);
			shader.update();
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
		position: fixed;
		height: calc(100vh - 82px);
		width: calc(100vw - 10px);
		inset: 77px 5px 5px 5px;
		border-radius: 6px;
	}
</style>
