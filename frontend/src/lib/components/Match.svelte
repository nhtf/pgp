<script lang="ts">
    import type { GameState, Player } from "$lib/entities";
    import { page } from "$app/stores";

	export let game: GameState;

	console.log(game.teams);

	const team = game.teams.find((team) => team.players.map((player) => player.userId).includes($page.data.user.id))!;
	const players = game.teams.reduce((sum: Player[], team) => sum.concat(team.players), []);
	const player = players.find((player) => player.userId === $page.data.user.id)!;

	const result = team.score - Math.max(...game.teams
		.filter(team => team.id !== player.teamId)
		.map(team => team.score));
</script>

<div class="match match-{result < 0 ? "loss" : result == 0 ? "draw" : "win"}">
	<div class="match-mode">{["Classic", "VR", "Modern"][game.gamemode]}</div>
	<div class="match-teams">
		{#each game.teams as team}
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
