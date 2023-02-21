<script lang="ts">
    import { BOUNCER } from "$lib/constants";
	import { json } from "$lib/Web";

	export let url: string;
</script>

<div style="position: absolute; top: 100px; left: 50px;">
	<div class="embed-spinner">
		<div class="embed-spinner-circle"></div>
		<div class="embed-spinner-circle"></div>
		<div class="embed-spinner-circle"></div>
		<div class="embed-spinner-circle"></div>
	</div>
</div>

<!--
{#await json(`${BOUNCER}/embed?${new URLSearchParams({ url })}`)}
	<div class="embed-spinner">
	</div>
{:then embed}
	<div class="embed-title">
		{JSON.stringify(embed)}
	</div>
{:catch error}
	<div class="embed-error">
		Failed to load embed: {error}
	</div>
{/await}
-->

<style>
	.embed-spinner {
		width: 25px;
		height: 25px;
		animation: spinner 2s linear infinite;
		font-size: 0;
	}

	.embed-spinner-circle {
		border-radius: 5px;
		background: var(--blue);
		width: 10px;
		height: 10px;
		display: inline-block;
	}

	.embed-spinner-circle:nth-of-type(1) {
		padding-left: 5px;
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
