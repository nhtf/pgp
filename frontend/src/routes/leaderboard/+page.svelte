<script lang="ts">
	import { User, type Stat } from "$lib/entities";
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
        Toggle,
	} from "flowbite-svelte";
    import { updateStore, userStore } from "$lib/stores";
    import { Gamemode, gamemodes } from "$lib/enums";
	import UserDropdown from "$lib/components/UserDropdown.svelte";

	export let data: PageData;

	let checked: boolean = true;
	let tabs = gamemodes.map((mode, index) => { return { ...mode, open: index === 0 } }); 
	let searchTerm = "";

	$: stats = (checked ? data.ranked : data.unranked);
	$: filteredStats = (checked ? data.ranked : data.unranked)
		.filter(({ username }) => username.toLowerCase().includes(searchTerm.toLowerCase()));

	updateStore(User, data.users);

	function partialUser(user: Partial<User>): User {
		return user as User;
	}

	function statFilter(username: string, gamemode: Gamemode, teams: number, stat: Stat) {
		return stat.username.toLowerCase().includes(username.toLowerCase())
			&& stat.gamemode === gamemode
			&& teams === stat.team_count;
	}

	function getRank(username: string, gamemode: Gamemode) {
		const gamemodeStats = stats.filter((stat) => stat.gamemode === gamemode);
		return gamemodeStats.findIndex((stat) => stat.username === username);
	}


</script>

<div class="page gap-0">
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
						{#each filteredStats.filter(statFilter.bind({}, searchTerm, gamemode, team)) as item}
							{#if $userStore.has(item.id)}
								<TableBodyRow
									color="custom"
									class="leaderboard-row rank{getRank(item.username, gamemode)}"
								>
									<TableBodyCell tdClass="table-cell">{getRank(item.username, gamemode) + 1}</TableBodyCell>
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
							{/if}
						{/each}
					</TableBody>
				</TableSearch>
			</TabItem>
		{/each}
		<div class="grow !ml-0"></div>
		<div class="flex items-center !ml-0">{checked ? "Ranked" : "Unranked"}</div>
		<Toggle bind:checked/>
	</Tabs>
</div>
