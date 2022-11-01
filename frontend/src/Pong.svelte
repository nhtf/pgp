<script lang="ts">
    import { Canvas } from "svelte-canvas";
    import Background from "./Background.svelte";
    import { sizes, playerOne } from './constants';
    import Paddle from "./Paddle.svelte";
    // import Ball from './Ball.svelte';

    let width_w: number = window.innerWidth;
    let height_h: number = window.innerHeight;

    function handleMouseMove(client: { x: number; y: number }): void {
        playerOne.x = client.x;
        playerOne.y = client.y;

        if (playerOne.x < sizes.border + sizes.linew)
            playerOne.x = sizes.border + sizes.linew;
        if (playerOne.x > window.innerWidth - sizes.border - sizes.linew)
            playerOne.x = window.innerWidth - sizes.border - sizes.linew;
        if (playerOne.y < sizes.border + sizes.paddleH / 2 + sizes.linew)
            playerOne.y = sizes.border + sizes.paddleH / 2 + sizes.linew;
        if (
            playerOne.y >
            window.innerHeight - sizes.border - sizes.paddleH / 2 - sizes.linew
        )
            playerOne.y =
                window.innerHeight -
                sizes.border -
                sizes.paddleH / 2 -
                sizes.linew;
    }

    function handleResize(): void {
        height_h = window.innerHeight;
        width_w = window.innerWidth;
        sizes.hexR = width_w / 25;
        sizes.border = height_h > width_w ? width_w / 10 : height_h / 10;
        sizes.borderR = sizes.border / 10 > 1 ? sizes.border / 10 : 1;
        sizes.fieldR = width_w * 0.45;
        sizes.goalH = height_h / 4;
        sizes.goalW = sizes.border / 3;
        sizes.linew = sizes.border / 10 > 1 ? sizes.border / 10 : 1;
        sizes.paddleH = height_h / 10;
        sizes.paddleW = width_w / 175 > 5 ? width_w / 175 : 5;
        sizes.offsetR = sizes.border - sizes.linew / 2;
    }
</script>

<div bind:clientHeight={height_h} bind:clientWidth={width_w}>
    <Canvas width={width_w} height={height_h} on:mousemove={handleMouseMove}>
        <Background />
        <Paddle />
        <!-- <Ball /> -->
    </Canvas>
</div>

<svelte:window on:resize={handleResize} />
