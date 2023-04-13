<script lang="ts">
	import type { leaderdata } from "./sorting";
	import type { PageData } from './$types';
	import { LEADERBOARDS } from "./sorting";
	import { onMount } from "svelte";
	import { 
		TableBody, 
		TableBodyCell, 
		TableBodyRow,
		TableHead, 
		TableHeadCell, 
		TableSearch,
		Tabs, 
		TabItem
	 } from "flowbite-svelte";
    import UserDropdown from "$lib/components/UserDropdown.svelte";
	import type { User } from "$lib/entities";

	export let data: PageData;

	let width: number;
	let height: number;
	
	function checkwindow() {
		if (width > 1350) {
			for (let i = 0; i < LEADERBOARDS.length; i+=1) {
				const el = document.getElementById(LEADERBOARDS[i].id);
				if (el)
					el.style.display = "flex";
			}
		}
		else {
			for (let i = 0; i < LEADERBOARDS.length; i+=1) {
				const el = document.getElementById(LEADERBOARDS[i].id);
				if (el) {
					if (LEADERBOARDS[i].active)
						el.style.display = "flex";
					else
						el.style.display = "none";
				}
			}
		}
	}

	onMount(() => {
		checkwindow();
		checkDiv();
	});

	let searchTerm = ["", ""];

	$: filteredItems = [
		data.lb[0].data.filter(
			(item: leaderdata) => item.username.toLowerCase().indexOf(searchTerm[0].toLowerCase()) !== -1
		),
		data.lb[1].data.filter(
			(item: leaderdata) => item.username.toLowerCase().indexOf(searchTerm[1].toLowerCase()) !== -1
		),
		data.lb[2].data.filter(
			(item: leaderdata) => item.username.toLowerCase().indexOf(searchTerm[1].toLowerCase()) !== -1
		),
		data.lb[3].data.filter(
			(item: leaderdata) => item.username.toLowerCase().indexOf(searchTerm[1].toLowerCase()) !== -1
		)
	];

	function checkDiv() {
		const elements = document.getElementsByClassName("relative overflow-x-auto rounded-lg overflow-y-auto");
		for (let i = 0; i < elements.length; i+=1) {
			for (let j = 0; j < elements[i].childNodes.length; j+=1) {
				const el = elements[i].childNodes[j] as HTMLElement;
				if (el.className === "p-4")
					el.style.padding = "0";
			}
		}
	}

	function partialUser(user: Partial<User>): User {
		return user as User;
	}

	//TODO make different tabs or toggle for ranked/unranked leaderboards
</script>

<svelte:window on:resize={checkwindow} bind:innerWidth={width} bind:innerHeight={height} on:click={checkDiv}/>

<div class="contain">
	<Tabs style="underline" 
	divider
	defaultClass="flex flex-wrap space-x-2 bg-c rounded"
	contentClass="tab-content-background">
		{#each LEADERBOARDS as {title, active}, index}
		<TabItem open={active} class="bg-c rounded" defaultClass="rounded"  title={title}>
			<TableSearch
			divClass="relative overflow-x-auto rounded-lg overflow-y-auto"
			class="bordered"
			placeholder="Search by username" hoverable={true} bind:inputValue={searchTerm[index]}>
			<TableHead class="table-head">
				<TableHeadCell class="table-cell-s">rank</TableHeadCell>
				<TableHeadCell class="table-cell-s">user</TableHeadCell>
				<TableHeadCell class="table-cell-s">wins</TableHeadCell>
				<TableHeadCell class="table-cell-s">losses</TableHeadCell>
				<TableHeadCell class="table-cell-s">draws</TableHeadCell>
			</TableHead>
			<TableBody>
			  {#each filteredItems[index] as item, i}
				<TableBodyRow color="custom" class="leaderboard-row rank{i + 1}">
				  <TableBodyCell tdClass="table-cell-s">{i + 1}</TableBodyCell>
				  <TableBodyCell tdClass="table-cell-s">
					<div class="flex items-center space-x-8 justify-center">
					<UserDropdown user={partialUser({ id: item.id })} extend={true} placement={"left"}/>
				</div></TableBodyCell>
				  <TableBodyCell tdClass="table-cell-s">{item.wins}</TableBodyCell>
				  <TableBodyCell tdClass="table-cell-s">{item.losses}</TableBodyCell>
				  <TableBodyCell tdClass="table-cell-s">{item.draws}</TableBodyCell>
				</TableBodyRow>
			  {/each}
			</TableBody>
		  </TableSearch>
		</TabItem>
		{/each}
	  </Tabs>
	
</div>

<style>

	.contain {
		display: flex;
		padding-top: 20px;
		flex-direction: column;
		justify-content: flex-start;
		position: relative;
		margin: 0 auto;
		width: 80%;
		height: calc(100vh - 80px);
	}

	@media (max-width: 500px) {
		.contain {
			width: 100%;

		}
	}
</style>
