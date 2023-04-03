<script lang="ts">
    import type { ObjectLiteral } from "$lib/stores";
    import { Access, Gamemode, Status } from "$lib/enums";

	export let caption: string | undefined = undefined;
	export let entities: ObjectLiteral[];

	const keys = Object.keys(entities[0] ?? {});
	const custom = [
		{ name: "status", fun: (value: any) => Status[value] },
		{ name: "access", fun: (value: any) => Access[value] },
		{ name: "gamemode", fun: (value: any) => Gamemode[value] },
	
		{ name: "state", fun: (value: any) => value?.id ?? "" },
		{ name: "achievements", fun: (value: any) => "-" },
		{ name: "avatar", fun: (value: any) => "-" },
	];


</script>

{#if entities.length > 0}
	<table>
		{#if caption}
			<caption>{caption}</caption>
		{/if}
		<tr>
			{#each keys as key}
				<th>{key}</th>
			{/each}
		</tr>
		{#each entities as entity}
			<tr>
				{#each keys as key}
					<td>
						{#if custom.some(({ name }) => name === key)}
							{custom.find(({ name }) => name === key)?.fun(entity[key]) }
						{:else if typeof entity[key] === "object" && entity[key] !== null}
							<svelte:self entities={Array.isArray(entity[key]) ? entity[key] : [entity[key]]}/>
						{:else}
							{entity[key] ?? ""}
						{/if}
					</td>
				{/each}
			</tr>
		{/each}
	</table>
{/if}

<style>
	table {
		border: 1px solid;
		height: min-content;
		/* margin: 0.5rem; */
		table-layout: fixed;
		text-align: center;
	}

	td,
	th,
	tr {
		border: inherit;
		padding: 0.5rem;
	}
</style>
