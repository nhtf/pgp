<script lang="ts">
	import type { PageData } from "./$types";
	import { page } from "$app/stores";
	export let data: PageData;
	import Avatar from "./avatar.svelte";
	import Achievements from "./achievements.svelte";

	function clickfunction(event: MouseEvent) {
		if (!event || !event.target)
			return;
		const element = event.target as Element;
		if (!element.matches(".icon") && !element.matches(".achievement_cell") && !element.matches(".icon-block")) {
			const achievements = document.getElementsByClassName("achievement-display");
			for (let i = 0; i < achievements.length; i += 1) {
				const ach = achievements[i] as HTMLElement;
				ach.style.display = "none";
			}
		}
	}
</script>

<svelte:window on:click={clickfunction}/>

<div class="block_vert" id="info">
	<div class="block_hor" id="user-block">
		<div class="block_cell">
			<div class="block_hor">
				<h1>{$page.params.username}</h1>
			</div>
			<div class="block_hor" id="level-hor">
				<div class="block_cell" id="level-block">
					<div class="block_hor" id="level-text">33</div>
					<div class="block_hor" id="level-text">Level</div>
				</div>
				<div class="block_cell" id="level-block-bar">
					<div class="block_hor" id="level-bar">
						<div class="border">
							<div class="bar" style="height:18px;width:20%" />
						</div>
					</div>
					<div class="block_hor" id="level-exp">123/12345 exp</div>
				</div>
			</div>
		</div>
		<Avatar data={data}/>
	</div>
	<div class="block_hor">
		<div class="block_cell">
			<Achievements data={data}/>
		</div>
	</div>
	{#if !data.user.in_game}
	<!-- //TODO check if the user is in_game and do the socket thing to get current data -->
	<p>in game block need to check if user is in-game or not</p>
	{/if}
</div>

<style>

	#user-block {
		width: -moz-available;
		width: -webkit-fill-available;
	}

	#level-block {
		max-width: 40px;
		min-width: 20px;
		height: 60px;
	}

	#level-bar {
		flex-grow: 1;
		padding-top: 0;
		padding-bottom: 0;
	}

	#level-block-bar {
		flex-grow: 1;
		height: 60px;
	}

	#level-exp {
		font-size: 12px;
		padding-top: 0;
		padding-bottom: 0;
		justify-content: flex-end;
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

	#info {
		flex-grow: 3;
		max-width: 600px;
	}

	.block_vert {
		flex-grow: 0.1;
	}

	.block_hor {
		width: -moz-available;
		width: -webkit-fill-available;
	}

	.block_cell {
		flex-direction: column;
		min-width: 100px;
		min-height: 40px;
		padding: 5px;
	}

	.block_cell:first-child {
		flex-grow: 1;
		text-align: center;
	}

</style>
