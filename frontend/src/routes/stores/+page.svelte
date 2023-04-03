<script lang="ts">
    import type { GameRoom } from "$lib/entities";
	import { gameStateStore, inviteStore, memberStore, roomStore, userStore } from "$lib/stores";
    import { status_colors } from "$lib/constants";
	import { byId } from "$lib/sorting";
    import { Gamemode, Status } from "$lib/enums";

	$: users = [...$userStore.values()];
	$: rooms = [...$roomStore.values()] as GameRoom[];
	$: games = [...$gameStateStore.values()];
	$: invites = [...$inviteStore.values()];
	$: members = [...$memberStore.values()];
</script>

<div class="flex flew-row flex-wrap gap-4 m-4">
	<table>
		<caption>Users</caption>
		<tr>
			<th>id</th>
			<th>name</th>
			<th>status</th>
			<th>room</th>
		</tr>
		{#each users.sort(byId) as user (user.id)}
			<tr>
				<td>{user.id}</td>
				<td>{user.username}</td>
				<td style="background-color: {status_colors[user.status]}">{Status[user.status]}</td>
				<td>{user.activeRoomId ?? ""}</td>
			</tr>
		{/each}
	</table>

	<table>
		<caption>Rooms</caption>
		<tr>
			<th>id</th>
			<th>name</th>
			<th>type</th>
			<th>owner</th>
			<th>state</th>
		</tr>
		{#each rooms.sort(byId) as room (room.id)}
			<tr>
				<td>{room.id}</td>
				<td>{room.name}</td>
				<td>{room.type}</td>
				<td>{room.owner?.id ?? ""}</td>
				<td>{room.state?.id ?? ""}</td>
			</tr>
		{/each}
	</table>

	<table>
		<caption>Games</caption>
		<tr>
			<th>id</th>
			<th>gamemode</th>
			<th>roomId</th>
			<th>locked</th>
			<th>teams</th>
		</tr>
		{#each games.sort(byId) as game (game.id)}
			<tr>
				<td>{game.id}</td>
				<td>{Gamemode[game.gamemode]}</td>
				<td>{game.roomId}</td>
				<td>{game.teamsLocked}</td>
				<td>
					<table>
						<tr>
							<th>id</th>
							<th>name</th>
							<th>players</th>
						</tr>
						{#each game.teams as team (team.id)}
							<tr>
								<td>{team.id}</td>
								<td>{team.name}</td>
								{#if team.players}
									<td>
										<table>
											<tr>
												<th>id</th>
												<th>userId</th>
												<th>name</th>
											</tr>
											{#each team.players as player (player.id)}
												<tr>
													<td>{player.id}</td>
													<td>{player.userId}</td>
													<td>{player.user?.username}</td>
												</tr>
											{/each}
										</table>
									</td>
								{:else}
									<td></td>
								{/if}
							</tr>
						{/each}
					</table>

				</td>
			</tr>
		{/each}
	</table>

	<table>
		<caption>Invites</caption>
		<tr>
			<th>id</th>
			<th>type</th>
			<th>to</th>
			<th>from</th>
			<th>room</th>
		</tr>
		{#each invites.sort(byId) as invite (invite.id)}
			<tr>
				<td>{invite.id}</td>
				<td>{invite.type}</td>
				<td>{invite.to.username}</td>
				<td>{invite.from.username}</td>
				<td>{invite.room?.id ?? ""}</td>
			</tr>
		{/each}
	</table>

	<table>
		<caption>Members</caption>
		<tr>
			<th>id</th>
			<th>type</th>
			<th>user</th>
			<th>room</th>
		</tr>
		{#each members.sort(byId) as member (member.id)}
			<tr>
				<td>{member.id}</td>
				<td>{member.type}</td>
				<td>{member.userId}</td>
				<td>{member.roomId}</td>
			</tr>
		{/each}
	</table>

</div>

<style>
	table {
		border-collapse: collapse;
		height: min-content;
		table-layout: fixed;
	}

	td,
	th,
	tr {
		border: 1px solid;
		border-collapse: collapse;
		padding: 0.5rem;
	}
</style>
