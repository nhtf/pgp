<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Ammo, ammoInit } from "./Ammo";
	import { Pong } from "./Pong";
	import type { PageData } from './$types';

	let world: Pong | undefined;
	let container: Element;

	export let data: PageData;

	onMount(async() => {
		console.log(data);

		await ammoInit();
		const VRButton = (await import("three/examples/jsm/webxr/VRButton.js")).VRButton;
		
		world = new Pong();
		console.log(world);
		container.append(world.renderer.domElement);
		container.append(VRButton.createButton(world.renderer));

		const canvas = document.querySelector('canvas');
		const button = document.getElementById('VRButton');

		if (canvas) {
			canvas.style.position = "relative";
			canvas.style.display = "flex";
			canvas.style.justifyContent = "center";
			canvas.style.height = "calc(100vh - 80px)";
			canvas.style.width = "100%";
			canvas.style.alignItems = "center";
			canvas.style.borderRadius = "6px";
			canvas.style.margin = "0 auto";
		}

		if (button) {
			button.style.zIndex = "100000";
			button.addEventListener('click', changeCanvasSize);
		}

		await world.start({ container, room: data.params.id });
	});

	onDestroy(() => {
		world?.stop();
	});

	function changeCanvasSize() {
		const canvas = document.querySelector('canvas');
		if (canvas) {
			canvas.style.position = "fixed";
			canvas.style.display = "flex";
			canvas.style.justifyContent = "center";
			canvas.style.height = "calc(100vh - 80px)";
			canvas.style.width = "calc(100% - 10px)";
			canvas.style.alignItems = "center";
			canvas.style.top = "75px";
			canvas.style.left = "5px";
			canvas.style.borderRadius = "6px";
		}
	}

</script>

<div bind:this="{container}" class="container"></div>

<style>
	.container {
		margin-left: 5px;
		margin-right: 5px;
		margin-bottom: 5px;
	}
</style>
