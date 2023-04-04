<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/stores";
	import { Classic } from "./Classic";
	import { Shader } from "./Shader";
    import type { GameRoom, GameRoomMember } from "$lib/entities";

	export let room: GameRoom;

	let canvas: HTMLCanvasElement;
	let classic: Classic;
	let frame: number;

	onMount(async () => {
		const shader = new Shader(canvas);
		classic = new Classic(shader.getCanvas());
		shader.addEventListener(classic);

		await classic.start({
			room,
			member: { ...room.self!	},
		});

		frame = window.requestAnimationFrame(function render(time) {
			classic.update(time);
			shader.update(time);
			frame = window.requestAnimationFrame(render);
		});
	});

	onDestroy(() => {
		classic?.stop();
		cancelAnimationFrame(frame);
	});
</script>

<canvas bind:this={canvas}></canvas>
