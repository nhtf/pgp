<script lang="ts">
	import { onMount } from "svelte";
	import { Ammo, ammoInit } from "./Ammo";
	import { Pong } from "./Pong";

	let world: Pong;
	let container: Element;
	let condition = true;

	onMount(async() => {
		await ammoInit();
		const VRButton = (await import("three/examples/jsm/webxr/VRButton.js")).VRButton;
		world = new Pong();
		container.append(world.renderer.domElement);
		container.append(VRButton.createButton(world.renderer));
		await world.init();
		world.start({ container });
	});
</script>

{#if condition}
<div bind:this="{container}" id=sceeee></div>
{/if}

<svelte:window />

<style>
	.page {

	}
	#sceeee {
		display: flex;
		height: 100vh;
		/* width: 100%; */
		/* position: relative; */
		z-index: 0;
	}
	/* #lol {
		display: inline-block;
		flex-wrap: wrap;
		width: 100%;
		height: 100%;
	} */
</style>
