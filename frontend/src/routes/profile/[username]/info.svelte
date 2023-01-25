<script lang="ts">
	import { page } from "$app/stores";
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
		<Avatar/>
	</div>
	<div class="block_hor">
		<div class="block_cell">
			<Achievements/>
		</div>
	</div>
	<div class="block_hor">
		<div class="block_cell">
			<h3>Last game played</h3>
			<div class="block_hor" id="legend">
				<div class="block_cell table-cell" id="no-grow">opponent</div>
				<div class="block_cell table-cell">me</div>
				<!-- <div class="block_cell">other stats</div> -->
			</div>
			<div class="block_hor" id="content">
				<div class="block_cell table-cell" id="no-grow">5</div>
				<div class="block_cell table-cell">3</div>
				<!-- <div class="block_cell table-cell">nope</div> -->
			</div>
		</div>
	</div>
	{#if !$page.data.user?.in_game}
	<div class="block_hor">
		<div class="block_cell">
			<p>Current game stats</p>
		</div>
	</div>
	{/if}
</div>

<style>

	.table-cell {
		/* border: 1px solid var(--border-color);
		border-radius: 6px; */
		/* box-shadow: 1px 1px 1px 1px var(--hover-color); */
		min-height: 25px;
	}

	#content {
		border-radius: 6px;
		height: 30px;
		max-width: 250px;
	}

	#legend {
        background: rgb(51, 55, 67);
		border-radius: 6px;
		height: 30px;
        /* box-shadow: 0 0 0 var(--box-color); */
		box-shadow: 2px 3px 5px 2px rgba(0, 0, 0, 0.4);
		margin-bottom: 5px;
		max-width: 250px;
    }

	#no-grow {
		flex-grow: 0;
	}

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
