<script lang="ts">
	import type { PageData } from "./$types";
	import {
		blockStore,
		friendStore,
		gameStateStore,
		inviteStore,
		memberStore,
		roomStore,
		userStore,
	} from "$lib/stores";
	import Match from "$lib/components/Match.svelte";
	import Table from "$lib/components/Table.svelte";

	export let data: PageData;

	const games = data.games;

	let stores: [string, Map<number, any>][];

	$: stores = [
		["Users", $userStore],
		["Rooms", $roomStore],
		["Games", $gameStateStore],
		["Blocked", $blockStore],
		["Members", $memberStore],
		["Invites", $inviteStore],
		["Friends", $friendStore],
	];

</script>

{#each stores as [caption, store]}
	<Table {caption} entities={[...store.values()]} />
{/each}

{#each games ?? [] as game (game.id)}
	<Match {game} />
{/each}
