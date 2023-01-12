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
		await world.init();
		world.start({ container });
	});

	onDestroy(() => {
		world?.stop();
	});
</script>

<div bind:this="{container}" id="container"></div>

<style>
	#container {
		height: calc(100vh - 71px);
	}
</style>
