<script lang="ts">
	import type { Stat, User } from "$lib/entities";
	import type { PageData } from "./$types";
	import {
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		TableSearch,
		Tabs,
		TabItem,
	} from "flowbite-svelte";
    import { Gamemode } from "$lib/enums";
	import UserDropdown from "$lib/components/UserDropdown.svelte";

	export let data: PageData;

	const PLAYER_NUMBERS: [Gamemode, number[], string][] = [
		[Gamemode.CLASSIC, [2], "Classic"],
		[Gamemode.VR, [2], "VR"],
		[Gamemode.MODERN, [2, 4], "Modern"],
	];

	let tabs = PLAYER_NUMBERS.map(([gamemode, teams, name], mode_index) => {
		return teams.map((team, team_index) => {
			return {
				title: `${name}${teams.length > 1 ? ` ${team}P` : ""}`,
				open: mode_index === 0 && team_index === 0,
				gamemode,
				team,
			}
		});
	}).flat();

	let searchTerm = "";

	$: stats = data.stats.filter(({ username }) => username.toLowerCase().includes(searchTerm.toLowerCase()));

	function partialUser(user: Partial<User>): User {
		return user as User;
	}

	function statFilter(username: string, gamemode: Gamemode, teams: number, stat: Stat) {
		return stat.username.toLowerCase().includes(username.toLowerCase())
			&& stat.gamemode === gamemode
			&& teams === stat.team_count;
	}

</script>

<div class="flex flex-col m-4">
	<Tabs
		style="underline"
		divider
		defaultClass="tab"
		contentClass="tab-content"
	>
		{#each tabs as { open, gamemode, team, title }}
			<TabItem bind:open {title}>
				<TableSearch
					bind:inputValue={searchTerm}
					divClass="relative overflow-x-auto rounded-lg overflow-y-auto"
					hoverable={true}
					placeholder="Search by username"
				>
					<TableHead class="table-head" defaultRow={false}>
						<TableHeadCell class="table-cell">rank</TableHeadCell>
						<TableHeadCell class="table-cell">user</TableHeadCell>
						<TableHeadCell class="table-cell">wins</TableHeadCell>
						<TableHeadCell class="table-cell">losses</TableHeadCell>
						<TableHeadCell class="table-cell">draws</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each stats.filter(statFilter.bind({}, searchTerm, gamemode, team)) as item, i}
							<TableBodyRow
								color="custom"
								class="leaderboard-row rank{i + 1}"
							>
								<TableBodyCell tdClass="table-cell">{i + 1}</TableBodyCell>
								<TableBodyCell tdClass="table-cell">
									<UserDropdown
										user={partialUser({ id: item.id })}
										extend={true}
										placement={"left"}
									/>
								</TableBodyCell>
								<TableBodyCell tdClass="table-cell">{item.wins}</TableBodyCell>
								<TableBodyCell tdClass="table-cell">{item.losses}</TableBodyCell>
								<TableBodyCell tdClass="table-cell">{item.draws}</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</TableSearch>
			</TabItem>
		{/each}
	</Tabs>
</div>
