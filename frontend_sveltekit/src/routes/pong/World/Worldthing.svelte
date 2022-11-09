<script lang="ts">
    import { World } from './World';
    import { onMount } from 'svelte';
    // import type { mousemove } from 'svelte';

    let world: World;

    onMount(() => {
        const container = document.querySelector('#scene-container');
        world = new World(container);
        world.start();
    })

  function handleResize() {
    console.log("resizing");
    world.resize();
  }

  function handleMovement(e: Event) {
    // console.log(e);
    world.movement(e);
  }
</script>

<div id="scene-container"></div>

<style>
    #scene-container {
	  width: 100%;
	  height: 100%;
    position: absolute;
  }
</style>

<!-- <svelte:window on:resize={handleResize} /> -->
<svelte:window on:resize={handleResize} on:mousemove={handleMovement} on:keydown={handleMovement} on:keyup={handleMovement}
/>