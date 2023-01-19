<script lang="ts">
    import {LEADERBOARDS, changeSort} from "./sorting";
    import type { PageData } from './$types';
    export let data: PageData;

    function sort(sorter: any, index_sorter: number, index: number) {
        changeSort(sorter, index_sorter, index, data.lb);
        data.lb = data.lb;
    }

    const leaderboards = ["vrpong", "orpong"];

    function changeActive(id: string) {
        console.log(id);
        const el = document.getElementById(id);
        if (el) {
            el.style.display = "flex";
        }
    }
    
</script>

<div class="block_container">
    <div class="tabs">
        {#each LEADERBOARDS as { title, id, sorter, active }, index}
        {#if active}
        <div class="block_cell" id="active-tab">{title}</div>
        {:else}
        <div class="block_cell" id="inactive-tab" on:click={() => changeActive(id)}>{title}</div>
        {/if}
        {/each}
    </div>
    {#each LEADERBOARDS as { title, id, sorter, active }, index}
        <!-- {#if active} -->
            <div class="block_vert" id={id}>
                <h1>{title}</h1>
                {#if data}
                    <div class="block_hor" id="legend">
                        {#each sorter as { type, active, ascending }, index_sorter}
                        <div class="block_cell" id={active}>
                            {type}
                            <div class="block_cell" id="arrow-icon"
                                on:click={() => {sort(sorter, index_sorter, index);}}
                                on:keypress={() => {sort(sorter, index_sorter, index);}}
                            >
                                {#if !ascending}
                                    <i class="arrow down" />
                                {:else}
                                    <i class="arrow up" />
                                {/if}
                            </div>
                        </div>
                        {/each}
                    </div>
                    {#each data.lb[index].data as { username, avatar, wins, losses, draws, rank }}
                        <div class="block_hor" id="rank{rank}">
                            <div class="block_cell">{rank}</div>
                            <div class="block_cell"><img id="small-avatars" src={avatar} alt="avatar"/>{username}</div>
                            <div class="block_cell">{wins}</div>
                            <div class="block_cell">{losses}</div>
                            <div class="block_cell">{draws}</div>
                        </div>
                    {/each}
                {/if}
            </div>
        <!-- {/if} -->
    {/each}
</div>

<style>
    :global(body) {
        font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica,
            Arial, sans-serif;
    }

    #active {
        text-decoration: underline;
    }

    #active-tab {
        background: black;
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
        /* border: solid orange; */
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

    .tabs {
        display: none;
        display: flex;
        background: var(--box-color);
        border-radius: 6px;
        flex-direction: row;
        justify-content: center;
    }

    .block_container {
        display: flex;
        height: 100%;
        gap: 10px;
        padding-left: 10px;
        padding-right: 10px;
        padding-top: 25px;
        padding-bottom: 25px;
        flex-wrap: wrap;
        color: var(--text-color);
        text-decoration: none;
        justify-content: center;
        position: relative;
        top: 0;
    }

    /* vertical blocks */
    .block_vert {
        height: calc(100vh - 150px);
        flex-grow: 1;
        display: flex;
        padding-left: 25px;
        padding-right: 25px;
        padding-bottom: 25px;
        background: var(--box-color);
        border-radius: 6px;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        overflow-y: auto;
        border-width: 2px;
        border-color: var(--border-color);
        border-style: solid;
        scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-bkg);
        scrollbar-width: thin;
        max-width: 600px;
        align-self: center;
    }

    #stretch {
        align-self: stretch;
    }

    /* horizontal blocks */
    .block_hor {
        display: flex;
        flex-direction: row;
        min-width: 80%;
        padding: 3px;
        margin: 5px;
        justify-content: center;
        align-items: center;
        border-radius: 6px;
        background: rgba(45, 107, 230, 0.5);
        box-shadow: 0 0  5px #9ecaed;
    }

    .block_cell {
        margin-left: 2px;
        margin-right: 2px;
        justify-content: center;
        min-width: 45px;
        padding-left: 2px;
        padding-right: 2px;
        height: 45px;
        overflow: hidden;
        align-items: center;
        color: var(--text-color);
        text-align: center;
        display: flex;
        flex-direction: row;
        position: relative;
    }

    .block_cell:first-child {
        /* align-self: flex-start; */
        width: 50px;
        align-self: center;
        /* justify-content: flex-start; */
    }

    .block_cell:nth-child(2) {
        flex-grow: 1;
        text-align: center;
        min-width: 100px;
        max-width: 200px;
        /* padding-left: 10px; */
    }

    #small-avatars {
        max-width: 25px;
        max-height: 25px;
        border-radius: 40%;
        margin-right: 2px;
    }

    #small-avatars:hover {
        box-shadow: 2px 2px 5px 5px rgba(var(--shadow-color));
    }

    ::-webkit-scrollbar {
        background: var(--box-color);
        width: 11px;
        box-shadow: inset 0 0 10px 10px var(--scrollbar-bkg);
        border-top: solid 1px transparent;
        border-bottom: solid 1px transparent;
    }

    ::-webkit-scrollbar-thumb {
        border-top: 3px solid transparent;
        border-left: 3px solid transparent;
        border-right: 2px solid transparent;
        border-bottom: 3px solid transparent;
        border-radius: 8px 8px 8px 8px;
        box-shadow: inset 12px 12px 12px 12px var(--scrollbar-thumb);
        margin: 0px auto;
    }

    @media (max-width: 450px) {
        .tabs {
            display: flex;
        }

        #vrpong {
            display: flex;
        }

        #orpong {
            display: none;
        }
    }
</style>
