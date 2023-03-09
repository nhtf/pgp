<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/stores";
	import { Modern } from "./Modern";
	import type { GAME } from "./Constants";
	import {RippleShader} from "./Shader/RippleShader";

	let canvas: HTMLCanvasElement;

	export let gameMode: GAME;
	
	let modern: Modern;
	let animation: number;

	//TODO implement powerups
	onMount(async () => {
		const rippleShader = new RippleShader(canvas);
		modern = new Modern(rippleShader.getCanvas(), gameMode);
		rippleShader.addEventListener(modern);
		await modern.init();
		await modern.start({ room: $page.data.room, member: {user: $page.data.user, ...$page.data.member }});

		animation = window.requestAnimationFrame(function render(time) {
			modern.update(time);
			rippleShader.update(time);
			animation = window.requestAnimationFrame(render);
		});
		canvas.requestPointerLock();

		//this is to lock the cursor, with this mouse only sends mousemove instead of location
		//TODO if specator don't do this
		canvas.addEventListener('click', function() { canvas.requestPointerLock();}, false);
	});

	onDestroy(() => {
		modern.stop();
		cancelAnimationFrame(animation);//this is needed otherwise it will continue to update even after going to other page
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
