<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { ammoInit } from "./World/Systems/ammo";
	import { Game } from "./World/Components/game";

	let world: Game;
	let container: Element;
	let condition = true;

	onMount(async() => {
		await ammoInit();
		const VRButton = (await import("three/examples/jsm/webxr/VRButton.js")).VRButton;
		world = new Game(container);
		container.append(world.renderer.domElement);
		container.append(VRButton.createButton(world.renderer));
		await world.load();
		world.start();
	});
</script>

{#if condition}
<div bind:this="{container}" id=sceeee></div>
{/if}

<svelte:window />

<style>
	#sceeee {
		width: 100%;
		height: 100%;
		position: absolute;
	}
</style>
