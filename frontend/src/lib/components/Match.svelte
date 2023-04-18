<script lang="ts">
    import type { Game, User } from "$lib/entities";
    import { byId } from "$lib/sorting";
    import { page } from "$app/stores";

	export let game: Game;
	export let user: User = $page.data.user;

	$: team = game.teams.find((team) => team.players.some(({ userId }) => userId === user.id))!;
	$: result = team?.score - Math.max(...game.teams
		.filter((x) => x.id !== team?.id)
		.map(({ score }) => score));

</script>

{#if game}
	<div class="match match-{result < 0 ? "loss" : result == 0 ? "draw" : "win"}">
		<div class="match-mode">{["Classic", "VR", "Modern"][game.gamemode]}</div>
		<div class="match-teams">
			{#each game.teams.sort(byId) as team (team.id)}
				<div class="match-team-wrapper">
					<div class="match-team">
						<div class="match-team-score">{Math.abs(team.score)}</div>
						<div class="match-team-name">{team.name}</div>
						{#each team.players.sort(byId) as player (player.id)}
							<div class="match-team-player">{player.user?.username}</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.match {
		text-align: center;
		line-height: normal;
	}

	.match-teams {
		display: flex;
		justify-content: center;
		flex-direction: row;
		min-width: 25rem;
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
