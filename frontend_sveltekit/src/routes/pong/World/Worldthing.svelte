<script lang="ts">
  import { World } from "./World";
  import { onMount } from "svelte";
  import socket from "../../chat/websocket";

  let world: World;

  onMount(() => {
    const container = document.querySelector("#scene-container");
    world = new World(container, socket);
    world.init();
    world.start();
    socket.on("moveEvent", (message) => {
      //here maybe stuff for what get back from backend
      console.log(message);
    });
  });

  function handleResize() {
    world.resize();
  }

  function handleMovement(e: Event) {
    //only for when not using VR
    world.movement(e);
  }
</script>

<div id="scene-container" />

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
    cursor: none;
  }
</style>
