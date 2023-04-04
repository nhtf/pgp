<script lang="ts">
    import type { ObjectLiteral } from "$lib/stores";
    import { Access, Gamemode, Status } from "$lib/enums";
    import { status_colors } from "$lib/constants";

	export let caption: string | undefined = undefined;
	export let entities: ObjectLiteral[];

	const keys = Object.keys(entities[0] ?? {});
	const custom = [
		{ name: "status", fun: (value: any) => `<div style="background-color: ${status_colors[value]}">${Status[value]}</div>` },
		{ name: "access", fun: (value: any) => value !== undefined ? Access[value] : "" },
		{ name: "gamemode", fun: (value: any) => value !== undefined ? Gamemode[value] : "" },
	
		{ name: "state", fun: (value: any) => value?.id ?? "" },
		{ name: "achievements", fun: (value: any) => "-" },
		{ name: "avatar", fun: (value: any) => value ? `<img class="avatar" src=${value} alt="avatar"/>` : ""},
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
				{#each keys.map((key) => [key, entity[key]]) as [key, value]}
					<td>
						{#if custom.some(({ name }) => name === key)}
							{@html custom.find(({ name }) => name === key)?.fun(value) }
						{:else if typeof value === "object" && value !== null}
							{#if Object.values(value).some((value) => value !== undefined)}
								<svelte:self entities={Array.isArray(value) ? value : [value]}/>
							{/if}
						{:else}
							{value ?? ""}
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
