<script lang="ts">
  import { World } from "./World";
  import { onMount } from "svelte";
  import socket  from '../../chat/websocket';

  let world: World;

  onMount(() => {
    const container = document.querySelector("#scene-container");
    world = new World(container);
    world.start();

    socket.on('moveEvent', message => {
      console.log(message);
    });
  });

  function handleResize() {
    world.resize();
  }

  function sendMovement() {
    console.log("emitting to backend");
    socket.emit('moveEvent', world.get().position, world.get().rotation);
  }

  function handleMovement(e: Event) {
    world.movement(e);
    sendMovement();

  }
</script>

<div id="scene-container" />

<!-- <svelte:window on:resize={handleResize} /> -->
<svelte:window
  on:resize={handleResize}
  on:mousemove={handleMovement}
  on:keydown={handleMovement}
  on:keyup={handleMovement}
/>

<style>
  #scene-container {
    width: 100%;
    height: 100%;
    position: absolute;
  }
</style>
