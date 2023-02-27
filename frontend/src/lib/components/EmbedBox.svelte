<script lang="ts">
	import { BOUNCER } from "$lib/constants";
	import { bounceEmbed } from "$lib/Web";
    import { Spinner } from "flowbite-svelte";

	export let url: string;
	export let digest: string;

	const urlInfo = new URL(url);

	function resize(node: any, ratio: number) {
		let frame = requestAnimationFrame(function onResize() {
			node.height = node.clientWidth / ratio;
			frame = requestAnimationFrame(onResize);
		});

		return {
			destroy: () => cancelAnimationFrame(frame),
		};
	}
</script>

<div class="embed">
	{#await bounceEmbed(digest, url)}
		<Spinner/>
		<div class="embed-spinner">
			<div class="embed-spinner-circle" />
			<div class="embed-spinner-circle" />
			<div class="embed-spinner-circle" />
			<div class="embed-spinner-circle" />
		</div>
	{:then embed}
		{#if embed.title}
			<p class="embed-title">{embed.title}</p>
		{/if}
		{#if embed.description}
			<p class="embed-description">{embed.description}</p>
		{/if}
		{#if ["www.youtube.com", "youtube.com", "youtu.be"].includes(urlInfo.host) && embed.video}
			<iframe
				class="embed-iframe"
				src={embed.video.url.url}
				use:resize={embed.video.width / embed.video.height}
				title="iframe"
			/>
		{:else if embed.image}
			<img
				class="embed-image"
				src={`${BOUNCER}/${embed.image.url.digest}/proxy?${new URLSearchParams({ url: embed.image.url.url })}`}
				alt="embed"
			/>
		{/if}
	{:catch error}
		<p class="embed-error">{error}</p>
	{/await}
</div>

<style>
	.embed {
		background: rgba(0, 0, 0, 25%);
		display: inline-block;
		max-width: 640px;
		padding: 5px;
		border-radius: 10px;
	}

	.embed-spinner {
		position: relative;
		margin: 100px 0px;
		left: calc(50% - 25px);
		width: 25px;
		height: 25px;
		animation: spinner 1s linear infinite;
	}

	.embed-spinner-circle {
		border-radius: 5px;
		background: var(--blue);
		width: 10px;
		height: 10px;
		position: absolute;
	}

	.embed-spinner-circle:nth-of-type(1),
	.embed-spinner-circle:nth-of-type(2) {
		top: 0px;
	}

	.embed-spinner-circle:nth-of-type(3),
	.embed-spinner-circle:nth-of-type(4) {
		bottom: 0px;
	}

	.embed-spinner-circle:nth-of-type(1),
	.embed-spinner-circle:nth-of-type(3) {
		left: 0px;
	}

	.embed-spinner-circle:nth-of-type(2),
	.embed-spinner-circle:nth-of-type(4) {
		right: 0px;
	}

	.embed-description {
		font-size: 0.75em;
	}

	.embed-iframe {
		width: 100%;
	}

	.embed-image {
		border-radius: 5px;
	}

	.embed-error {
		color: var(--red);
	}

	@keyframes spinner {
		0% {
			transform: rotate(0deg);
		}

		100% {
			transform: rotate(360deg);
		}
	}
</style>
