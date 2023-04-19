<script lang="ts">
	import {
		blockStore,
		friendStore,
		gameStore,
		inviteStore,
		memberStore,
		roomStore,
		userStore,
	} from "$lib/stores";
	import Table from "$lib/components/Table.svelte";

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

<!-- TODO: remove -->
{#key stores}
	{#each stores as [caption, store]}
		<Table {caption} entities={[...store.values()]} />
	{/each}
{/key}
