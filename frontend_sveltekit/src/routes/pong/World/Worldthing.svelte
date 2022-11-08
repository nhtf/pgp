<script lang="ts">
    import { World } from './World';
    import { onMount } from 'svelte';

    let world: World;

    onMount(() => {
        const container = document.querySelector('#scene-container');
        console.log(container);
        world = new World(container);
        world.start();
    })

  function handleResize() {
    console.log("resizing");
    // console.log(window);
    world.resize();
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

<svelte:window on:resize={handleResize} />