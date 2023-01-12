<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Ammo, ammoInit } from "./Ammo";
	import { Pong } from "./Pong";

	let world: Pong | undefined;
	let container: Element;

	

	onMount(async() => {
		await ammoInit();
		const VRButton = (await import("three/examples/jsm/webxr/VRButton.js")).VRButton;
		
		world = new Pong();
		console.log(world);
		container.append(world.renderer.domElement);
		container.append(VRButton.createButton(world.renderer));
		const button = document.getElementById('VRButton');
		if (button) {
			button.style.zIndex = "100000";
			button.addEventListener('click', changeCanvasSize);
		}
		await world.init();
		world.start({ container });
		
		
	});

	onDestroy(() => {
		world?.stop();
	});

	function changeCanvasSize() {
		console.log("what up");
		const canvas = document.querySelector('canvas');
		console.log("canvas.....: ", canvas);
		if (canvas && canvas.style) {
			canvas.style.display = "block";
			canvas.style.position = "relative";
			canvas.style.top = "71px";
			canvas.style.height = "calc(100vh - 71px)";}
	}
</script>

<div bind:this="{container}" id="container"></div>

<style>
	#container {
		height: calc(100vh - 71px);
	}

	canvas {
	height: 200px;
	width: 200px;
}
	
</style>
