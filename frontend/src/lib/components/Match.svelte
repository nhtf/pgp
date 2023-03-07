<script lang="ts">
	export let player: any;

	const state = player.team.state;
	const result = player.team.score - Math.max(...state.teams
		.filter(team => team.id != player.team.id)
		.map(team => team.score));
</script>

<div class="match match-{result < 0 ? "loss" : result == 0 ? "draw" : "win"}">
	<div class="match-mode">{["Classic", "VR", "Modern"][state.gamemode]}</div>
	<div class="match-teams">
		{#each state.teams as team}
			<div class="match-team-wrapper">
				<div class="match-team">
					<div class="match-team-score">{Math.abs(team.score)}</div>
					<div class="match-team-name">{team.name}</div>
					{#each team.players as player}
						<div class="match-team-player">{player.user.username}</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.match {
		text-align: center;
		line-height: normal;
	}

	.match-teams {
		display: flex;
		justify-content: center;
	}

	.match-team {
		display: inline-block;
		width: 80px;
	}

	.match-team-score {
		font-size: 3em;
	}

	.match-team-name {
		font-size: 0.75em;
		font-weight: bold;
	}

	.match-team-player {
		font-size: 0.5em;
	}

	.match-win .match-team-score {
		color: var(--green);
	}
	
	.match-draw .match-team-score {
		color: var(--blue);
	}

	.match-loss .match-team-score {
		color: var(--red);
	}

	.match-team-wrapper:not(:first-child)::before {
		content: "-";
		vertical-align: top;
		font-size: 3em;
	}
</style>
