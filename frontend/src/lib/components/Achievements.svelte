<script lang="ts">
	import { page } from "$app/stores";

	function showAchievementBlock(name: string) {
		console.log("clicker-noise");
		const achievements = document.getElementsByClassName(
			"achievement-display"
		);
		for (let i = 0; i < achievements.length; i += 1) {
			const ach = achievements[i] as HTMLElement;
			ach.style.display = "none";
			if (ach.id === name) {
				ach.style.display = "flex";
			}
		}
	}

	const radius = 30;
	const cirmum = radius * 2 * Math.PI;
</script>

<div class="block-hor"><h3>Achievements</h3></div>
<div class="block-hor" id="wrap">
	{#if $page.data.profile?.achievements}
		{#each $page.data.profile.achievements as { name, have, icon, level, progress, level_cost, text }}
			{#if have}
				<div
					class="achievement_cell"
					id="achievement-icon"
					on:click={() => showAchievementBlock(name)}
					on:keypress={() => showAchievementBlock(name)}
				>
					<div class="block-hor icon-block" id="icon-block{level}">
						<div
							class="icon"
							id="ach-level{level}"
							title={name}
							style="mask-image: url({icon});-webkit-mask-image: url({icon})"
						/>
					</div>
					<div class="block-hor">
						<div class="border" id="ach-border">
							{#if level < 3}
								<div
									class="bar"
									id="ach-bar"
									style="height:5px;width:calc({(progress /
										level_cost[level]) *
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
								<div class="achievement-display" id={name}>
									<div class="achievement_cell" id="fit">
										<div class="block-hor">
											<b>{name}</b>
										</div>
										<div class="block-hor" id="big">
											<div
												class="icon-block-big"
												id="icon-block{level}"
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
														style:stroke-dashoffset={cirmum - (progress / level_cost[level]) * cirmum}
													/>
												</svg>
												<div
													class="icon move"
													id="ach-level{level}"
													title={name}
													style="mask-image: url({icon});
                                        -webkit-mask-image: url({icon});"
												/>
											</div>
										</div>
										{#if level < 3}
											<div class="block-hor">
												{progress}/{level_cost[level]}
											</div>
										{/if}
										<div class="block-hor">
											{text[level]}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/each}
	{/if}
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
		display: none;
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

	#icon-block0 {
		border: 4px solid #967444;
		outline: 1px solid #75572e;
	}

	#icon-block1 {
		border: 4px solid silver;
		outline: 1px solid rgb(130, 130, 130);
	}

	#icon-block2 {
		border: 4px solid gold;
		outline: 2px solid rgb(151, 128, 0);
	}

	#icon-block3 {
		border: 4px solid #7eeee2;
		outline: 2px solid #4eb2a8;
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

	#ach-level0 {
		outline: 3px solid #967444;
		background-color: #967444;
	}

	#ach-level1 {
		outline: 3px solid silver;
		background-color: silver;
	}

	#ach-level2 {
		outline: 3px solid gold;
		background-color: gold;
	}

	#ach-level3 {
		outline: 3px solid #7eeee2;
		background-color: #7eeee2;
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
