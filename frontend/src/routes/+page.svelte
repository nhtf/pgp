<script lang="ts">
	import type { PageData } from "./$types";
	import {
		blockStore,
		friendStore,
		gameStore,
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
		["Games", $gameStore],
		["Blocked", $blockStore],
		["Members", $memberStore],
		["Invites", $inviteStore],
		["Friends", $friendStore],
	];

</script>

{#key stores}
	{#each stores as [caption, store]}
		<Table {caption} entities={[...store.values()]} />
	{/each}
{/key}

{#each games ?? [] as game (game.id)}
	<Match {game} />
{/each}
