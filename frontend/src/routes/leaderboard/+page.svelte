<script lang="ts">
    import {LEADERBOARDS, changeSort} from "./sorting";
    import type { PageData } from './$types';
    import { onMount } from "svelte";
    export let data: PageData;
    import { 
        Avatar, 
        TableBody, 
        TableBodyCell, 
        TableBodyRow,
        TableHead, 
        TableHeadCell, 
        TableSearch,
        Tabs, 
        TabItem
     } from "flowbite-svelte";
    let width: number;
    let height: number;

    function sort(sorter: any, index_sorter: number, index: number) {
        changeSort(sorter, index_sorter, index, data.lb);
        data.lb = data.lb;
    }

    function changeActive(id: string, index: number) {
        console.log(id);
        for (let i = 0; i < LEADERBOARDS.length; i+=1) {
            LEADERBOARDS[i].active = false;
            const el = document.getElementById(LEADERBOARDS[i].id);
            if (el)
                el.style.display = "none";
        }
        LEADERBOARDS[index].active = true;
        const el = document.getElementById(id);
        if (el) {
            el.style.display = "flex";
        }
    }
    
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
    });

    let searchTerm = ["", ""];

    $: filteredItems = [data.lb[0].data.filter(
    (item) => item.username.toLowerCase().indexOf(searchTerm[0].toLowerCase()) !== -1
    ) ,
    data.lb[1].data.filter(
    (item) => item.username.toLowerCase().indexOf(searchTerm[1].toLowerCase()) !== -1
    )
    ];
</script>

<svelte:window on:resize={checkwindow} bind:innerWidth={width} bind:innerHeight={height}/>



<div class="contain">
    <Tabs style="underline" 
    divider
    defaultClass="flex flex-wrap space-x-2 background-color-custom"
    contentClass="tab-content-background">
        {#each LEADERBOARDS as {title, active}, index}
        <TabItem open={active} class="background-color-custom"  title={title}>
            <TableSearch
            divClass="relative overflow-x-auto rounded-lg overflow-y-auto"
            class="bordered"
            placeholder="Search by username" hoverable={true} bind:inputValue={searchTerm[index]}>
            <TableHead class="table-head">
              <TableHeadCell class="table-cell-s">rank</TableHeadCell>
              <TableHeadCell class="table-cell-s">user</TableHeadCell>
              <TableHeadCell class="table-cell-s">wins</TableHeadCell>
              <TableHeadCell class="table-cell-s">lose</TableHeadCell>
              <TableHeadCell class="table-cell-s">draw</TableHeadCell>
            </TableHead>
            <TableBody>
              {#each filteredItems[index] as item}
                <TableBodyRow color="custom" class="leaderboard-row rank{item.rank}">
                  <TableBodyCell tdClass="table-cell-s">{item.rank}</TableBodyCell>
                  <TableBodyCell tdClass="table-cell-s">
                    <div class="flex items-center space-x-8 justify-center">
                    {#if item.avatar}
                    <Avatar src={item.avatar} size="sm"/>
                    {:else}
                    <Avatar src="/avatar-default.png" size="sm"/>
                    {/if}
                    <div class="space-y-1 font-medium dark:text-white space-x-2 padding-left">
                        <div>{item.username}</div>
                    </div>
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
        padding-top: 25px;
        padding-bottom: 25px;
        flex-direction: column;
        justify-content: center;
        position: relative;
        margin: 0 auto;
        width: 80%;
    }

    @media (max-width: 500px) {
        .contain {
            width: 100%;

        }
    }
    /* :global(body) {
        font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica,
            Arial, sans-serif;
    }

    .arrow {
        border: solid var(--text-color);
        border-width: 0 3px 3px 0;
        display: flex;
        padding: 2px;
        margin-left: 4px;
    }

    #arrow-icon {
        width: 15px;
        min-width: 0;
        align-self: flex-start;
        justify-content: flex-start;
        margin: 0;
        padding: 0;
        cursor: pointer;
    }

    .arrow:hover {
        box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
    }

    .up {
        transform: rotate(-135deg);
          -webkit-transform: rotate(-135deg);
    }

    .down {
        transform: rotate(45deg);
        -webkit-transform: rotate(45deg);
    }

    .down:hover {
        box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
    }

    .rank1{
        background: rgba(230, 188, 0, 0.7);
        box-shadow: 0 0  5px #faeba8;
    }

    #rank1 {
        background: rgba(230, 188, 0, 0.7);
        box-shadow: 0 0  5px #faeba8;
    }

    #rank2 {
        background: rgba(103, 127, 148, 0.7);
        box-shadow: 0 0  5px #9d9d9d;
    }

    #rank3 {
        background: rgba(153, 115, 78, 0.7);
        box-shadow: 0 0  5px #f7d2ae;
    }

    #legend {
        background: var(--box-color);
        box-shadow: 0 0 0 var(--box-color);
    }

    #active {
        text-decoration: underline;
    }

    #active-tab {
        background: var(--tab-active-color);
        border-bottom: 2px solid var(--tab-underline-color);
    }

    #active-tab:hover{
        background: var(--box-color);
    }

    .tabs {
        display: none;
        background: var(--box-color);
        flex-direction: row;
        justify-content: center;
        max-width: 200px;
        align-self: center;
        align-items: center;
        height: 50px;
        cursor: pointer;
        border-color: var(--border-color);
        border-radius: 6px;
        padding: 0;
    }

    .tab_cell {
        justify-content: center;
        min-width: 45px;
        padding-left: 5px;
        padding-right: 5px;
        margin-left: 2px;
        margin-right: 2px;
        height: 45px;
        align-self: center;
        align-items: center;
        color: var(--text-color);
        text-align: center;
        display: flex;
        flex-direction: row;
        position: relative;
        border-radius: 6px;
        background: var(--tab-inactive-color);
        border-style: solid;
        border-color: var(--border-color);
        border-width: 2px;
    }

    .tab_cell:hover {
        box-shadow: 2px 2px 2px 2px var(--shadow-color);
    }

    .block_container {
        flex-direction: row;
    }

    .block_vert {
        flex-grow: 1;
        width: 600px;
        max-width: 600px;
        align-self: center;
    }

    #stretch {
        align-self: stretch;
    }

    .block_hor {
        min-width: 80%;
        margin: 5px;
        border-radius: 6px;
        background: rgba(45, 107, 230, 0.5);
        box-shadow: 0 0  5px #9ecaed;
    }

    .block_cell {
        margin-left: 2px;
        margin-right: 2px;
        min-width: 45px;
        padding-left: 2px;
        padding-right: 2px;
        height: 45px;
        overflow: hidden;
    }

    .block_cell:first-child {
        width: 50px;
        align-self: center;
    }

    .block_cell:nth-child(2) {
        flex-grow: 1;
        max-width: 150px;
    }

    .small-avatars {
        margin-right: 2px;
    }

    @media (max-width: 1350px) {
        .tabs {
            display: flex;
        }

        #vrpong {
            display: flex;
        }

        #orpong {
            display: none;
        }

        .block_container {
            flex-direction: column;
        }
    }

    @media (max-width: 850px) {
        .tabs {
            display: flex;
        }

        #vrpong {
            display: flex;
        }

        #orpong {
            display: none;
        }

        .block_container {
            flex-direction: column;
            padding-left: 2px;
            padding-right: 2px;
        }

        .block_vert {
            padding-left: 5px;
            padding-right: 5px;
            min-width: 80%;
            max-width: 600px;
        }
    }

    @media (max-width: 500px) {
        .block_vert {
            width: 400px;
        }
    }

    @media (max-width: 400px) {
        .block_vert {
            width: 350px;
        }
    }

    @media (max-height: 900px) {
        .block_vert {
            height: 600px;
            padding-bottom: 0;
        }
    }

    @media (max-height: 400px) {
        .block_vert {
            height: 100%;
            padding-bottom: 0;
        }
    }

    @media (min-width: 900px) {
        #vrpong {
            display: flex;
        }

        #orpong {
            display: flex;
        }
    } */
</style>
