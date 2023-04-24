<script lang="ts">
	import type { Achievement, Objective } from "$lib/types";

	export let achievement: Achievement;
	const radius = 30;
	const cirmum = radius * 2 * Math.PI;
	let current_obj: Objective = achievement.objectives[0];
	let display = false;

	for (const obj of achievement.objectives) { 
		if (!current_obj || current_obj.threshold <= achievement.progress)
			current_obj = obj;
	}

	//https://svelte.dev/repl/0ace7a508bd843b798ae599940a91783?version=3.16.7
	//https://github.com/sveltejs/svelte/issues/3012#issuecomment-1407898151
	function clickOutside(node: HTMLElement, ignore?: string) {
		
		const handleClick = (event: Event) => {
			const target = event.target as HTMLElement;
			if (!event.target || ignore && target.closest(ignore)) {
				return;
			}
			if (node && !node.contains(target) && !event.defaultPrevented)
				node.dispatchEvent(new CustomEvent("click_outside"));
		};

		document.addEventListener('click', handleClick);

		return {
			destroy() {
				document.removeEventListener('click', handleClick);
			}
		}
	}

	const progress = achievement.progress / (current_obj?.threshold ?? 1);
	const achieved = achievement.progress >= achievement.objectives[0].threshold;
	const color = achieved ? current_obj!.color : "gray";
</script>

<div
	class="achievement_cell"
	id="achievement-icon"
	on:click={() => display = true}
	on:keypress={() => display = true}
	use:clickOutside
	on:click_outside={() => display = false}
>
	<div class="block-hor icon-block unlocked-{achieved}" style="border: 4px solid {color};">
		<div
			class="icon"
			title={achievement.name}
			style="mask-image: url({achievement.image});-webkit-mask-image: url({achievement.image});background-color: {color};"
		/>
	</div>
	<div class="block-hor">
		<div class="border" id="ach-border">
			{#if progress != 1}
				<div
					class="bar"
					id="ach-bar"
					style="height:5px;width:calc({progress *
						100}%)"
				/>
			{:else}
				<div
					class="bar"
					id="ach-bar-full"
					style="height:3px;width:100%"
				/>
			{/if}
			<div class="test">
				{#if display}
				<div class="achievement-display" id={achievement.name} >
					<div class="achievement_cell" id="fit">
						<div class="block-hor">
							<b>{current_obj.name}</b>
						</div>
						<div class="block-hor" id="big">
							<div
								class="icon-block-big"
								style="border: 4px solid {color};"
							>
								<svg class="prog-ring">
									<circle
										class="normal-circle"
										r={radius}
										cx="29"
										cy="21"
									/>
									<circle
										class="prog-ring__circle"
										r={radius}
										cx="29"
										cy="21"
										style:stroke-dashoffset={cirmum - progress * cirmum}
									/>
								</svg>
								<div
									class="icon move"
									title={achievement.name}
									style="mask-image: url({achievement.image});
									-webkit-mask-image: url({achievement.image});background-color: {color};"
								/>
							</div>
						</div>
						{#if progress != 1}
							<div class="block-hor">
								{achievement.progress}/{current_obj.threshold}
							</div>
						{/if}
						<div class="block-hor">
							{current_obj.description}
						</div>
					</div>
				</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.block-hor {
		width: -moz-available;
		width: -webkit-fill-available;
	}
	.bar {
		background: var(--bar-prog-color);
		border-radius: 10px;
	}
	.border {
		background: var(--bar-bkg-color);
		border: 1px solid var(--hover-color);
		border-radius: 10px;
		width: 100%;
	}
	.move {
		top: -53px;
		right: 4px;
	}
	.prog-ring {
		width: 50px;
		height: 50px;
		overflow: visible;
		position: relative;
	}
	.prog-ring__circle {
		stroke: var(--progress-color);
		stroke-width: 3;
		fill: transparent;
		stroke-linecap: round;
		transition: 0.35s stroke-dashoffset;
		transform: rotate(-90deg);
		transform-origin: 50% 50%;
		stroke-dasharray: var(--circumference) var(--circumference);
		z-index: 250;
	}
	.normal-circle {
		stroke: lightgray;
		stroke-width: 1;
		fill: transparent;
		transition: 0.35s stroke-dashoffset;
		transform: rotate(-90deg);
		transform-origin: 50% 50%;
		stroke-dasharray: var(--circumference) var(--circumference);
	}
	b {
		font-size: xx-large;
	}
	#fit {
		width: 100%;
		height: 100%;
	}
	.test {
		display: flex;
		position: relative;
		margin: 0 auto;
		justify-content: center;
		align-items: center;
		align-self: center;
	}
	#big {
		scale: 3;
		width: auto;
		/* padding-bottom: 15px;
		align-items: flex-start; */
	}
	.achievement-display {
		/*display: flex;*/
		position: fixed;
		flex-direction: column;
		width: 500px;
		height: 400px;
		background: var(--box-color);
		border-color: var(--border-color);
		border-radius: 10px;
		border-width: 2px;
		box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
		margin: 0;
		top: calc(50% - 200px);
		left: calc(50% - 250px);
		z-index: 20;
		justify-content: center;
		align-items: center;
	}
	#ach-border {
		display: flex;
		align-items: center;
		height: 0px;
		padding: 1px;
	}
	#ach-bar {
		position: relative;
		right: 2px;
		width: 110%;
	}
	#ach-bar-full {
		outline: 1px solid var(--bar-prog-color);
	}
	.icon-block {
		padding: 0;
		/* height: 50px;
        width: 50px; */
		border: 4px solid gold;
		border-radius: 50%;
		outline: 2px solid silver;
		scale: 0.9;
	}
	.icon-block-big {
		padding: 0;
		height: 50px;
		width: 50px;
		border: 4px solid gold;
		border-radius: 50%;
		outline: 2px solid silver;
		scale: 0.9;
	}
	.icon-block:hover {
		box-shadow: 0px 0px 8px 8px var(--shadow-color);
	}

	.icon {
		background-color: #967444;
		width: 50px;
		height: 50px;
		scale: 0.65;
		display: flex;
		position: relative;
		filter: none;
		-webkit-filter: none;
	}

	#achievement-icon {
		padding: 2px;
	}

	.achievement_cell {
		display: flex;
		align-items: center;
		text-align: center;
		position: relative;
		color: var(--text-color);
		justify-content: space-around;
		flex-direction: column;
		/* cursor: pointer; */
	}

	.unlocked-false{
		filter: opacity(0.2);
	}

	#wrap {
		flex-wrap: wrap;
	}
	@media (max-width: 750px) {
		.achievement-display {
			width: 250px;
			height: 250px;
			top: calc(50% - 125px);
			left: calc(50% - 125px);
		}
		#big {
			scale: 2;
			width: auto;
			height: 120px;
			/* padding-bottom: 15px; */
		}
		b {
			font-size: large;
		}
	}
</style>
