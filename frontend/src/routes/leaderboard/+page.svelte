<script lang="ts">
    type leaderdata = {
        username: string;
        avatar: string;
        wins: number;
        losses: number;
        draws: number;
        rank: number;
    };
    let leaderboardData = [
        {id: "vrpong",
        data: [
            {
                username: "user1",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 10,
                losses: 0,
                draws: 0,
                rank: 1,
            },
            {
                username: "user5",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 7,
                losses: 1,
                draws: 3,
                rank: 2,
            },
            {
                username: "user2",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 6,
                losses: 3,
                draws: 1,
                rank: 3,
            },
            {
                username: "user3",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 6,
                losses: 2,
                draws: 0,
                rank: 4,
            },
            {
                username: "user4",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 3,
                losses: 7,
                draws: 7,
                rank: 5,
            },
            {
                username: "user6",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 2,
                losses: 2,
                draws: 2,
                rank: 6,
            },
            {
                username: "user8",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 1,
                losses: 4,
                draws: 3,
                rank: 7,
            },
        ]},
        {id: "orpong",
        data:[
            {
                username: "user1d2",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 10,
                losses: 0,
                draws: 0,
                rank: 1,
            },
            {
                username: "user5d2",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 7,
                losses: 1,
                draws: 3,
                rank: 2,
            },
            {
                username: "user2d2",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 6,
                losses: 3,
                draws: 1,
                rank: 3,
            },
            {
                username: "user3d2",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 6,
                losses: 2,
                draws: 0,
                rank: 4,
            },
            {
                username: "user4d2",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 3,
                losses: 7,
                draws: 7,
                rank: 5,
            },
            {
                username: "user6d2",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 2,
                losses: 2,
                draws: 2,
                rank: 6,
            },
            {
                username: "user8d2",
                avatar: "http://localhost:3000/avatar/3.jpg",
                wins: 1,
                losses: 4,
                draws: 3,
                rank: 7,
            },
        ]},
        ];

    type sorting = { type: string; active: string; ascending: boolean };
    type sorter = sorting[];

    const LEADERBOARDS = [
        {
            title: "VR Pong",
            id: "vrpong",
            sorter: [
                { type: "rank", active: "active", ascending: false },
                { type: "user", active: "inactive", ascending: false },
                { type: "win", active: "inactive", ascending: false },
                { type: "lose", active: "inactive", ascending: false },
                { type: "draw", active: "inactive", ascending: false },
            ],
            active: true,
        },
        {
            title: "Classic Pong",
            id: "2dpong",
            sorter: [
                { type: "rank", active: "active", ascending: false },
                { type: "user", active: "inactive", ascending: false },
                { type: "win", active: "inactive", ascending: false },
                { type: "lose", active: "inactive", ascending: false },
                { type: "draw", active: "inactive", ascending: false },
            ],
            active: true,
        },
    ];

    function changeSort(sorter: sorter, type: number, index: number) {
        sorter.forEach((value, index) => {
            if (index !== type) {
                value.active = "inactive";
                value.ascending = false;
            }
        });
        if (sorter[type].active === "active") {
            sorter[type].ascending = !sorter[type].ascending;
            leaderboardData[index].data.sort(compare_functions[type]);
            if (!sorter[type].ascending) {
                leaderboardData[index].data.reverse();
            }
        } else {
            sorter[type].active = "active";
        }
        LEADERBOARDS[index].sorter = sorter;
        leaderboardData = leaderboardData;
    }

    function compare_rank(a: leaderdata, b: leaderdata) {
        if (a.rank < b.rank) {
            return -1;
        }
        if (a.rank > b.rank) {
            return 1;
        }
        return 0;
    }

    function compare_username(a: leaderdata, b: leaderdata) {
        if (a.username < b.username) {
            return -1;
        }
        if (a.username > b.username) {
            return 1;
        }
        return 0;
    }

    function compare_wins(a: leaderdata, b: leaderdata) {
        if (a.wins < b.wins) {
            return -1;
        }
        if (a.wins > b.wins) {
            return 1;
        }
        return 0;
    }

    function compare_losses(a: leaderdata, b: leaderdata) {
        if (a.losses < b.losses) {
            return -1;
        }
        if (a.losses > b.losses) {
            return 1;
        }
        return 0;
    }

    function compare_draws(a: leaderdata, b: leaderdata) {
        if (a.draws < b.draws) {
            return -1;
        }
        if (a.draws > b.draws) {
            return 1;
        }
        return 0;
    }

    const compare_functions = [
        compare_rank,
        compare_username,
        compare_wins,
        compare_losses,
        compare_draws,
    ];
</script>

<div class="block_container">
    {#each LEADERBOARDS as { title, id, sorter, active }, index}
        {#if active}
            <div class="block_vert" {id}>
                <h1>{title}</h1>
                {#if leaderboardData}
                    <div class="block_hor" id="legend">
                        {#each sorter as { type, active, ascending }, index_sorter}
                            <div class="block_cell" id={active}>
                                {type}
                                <div
                                    class="block_cell"
                                    id="arrow-icon"
                                    on:click={() => {
                                        changeSort(sorter, index_sorter, index);
                                    }}
                                    on:keypress={() => {
                                        changeSort(sorter, index_sorter, index);
                                    }}
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
                    {#each leaderboardData[index].data as { username, avatar, wins, losses, draws, rank }}
                        <div class="block_hor" id="rank{rank}">
                            <div class="block_cell">{rank}</div>
                            <div class="block_cell"><img
                                id="small-avatars"
                                src={avatar}
                                alt="avatar"
                            />{username}</div>
                            <div class="block_cell">{wins}</div>
                            <div class="block_cell">{losses}</div>
                            <div class="block_cell">{draws}</div>
                        </div>
                    {/each}
                {/if}
            </div>
        {/if}
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

    .block_container {
        display: flex;
        gap: 10px;
        padding-left: 10px;
        padding-right: 10px;
        padding-top: 25px;
        padding-bottom: 25px;
        flex-wrap: wrap;
        color: var(--text-color);
        text-decoration: none;
        justify-content: center;
    }

    /* vertical blocks */
    .block_vert {
        height: calc(90vh - 10em);
        flex-grow: 1;
        display: flex;
        padding-left: 25px;
        padding-right: 25px;
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
        overflow-x: auto;
        max-width: 750px;
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
        /* margin-left: 25px; */
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
        max-width: 200px;
        overflow: hidden;
        align-items: center;
        color: var(--text-color);
        text-decoration: none;
        text-align: center;
        display: flex;
        flex-direction: row;
        align-self: center;
        position: relative;
    }

    .block_cell:first-child {
        align-self: flex-start;
    }

    .block_cell:nth-child(2) {
        flex-grow: 1;
        text-align: center;
        min-width: 100px;
    }

    .block_cell:nth-child(3) {
        /* width: 50px; */
        right: 1em;
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

    .dropdown-content {
        display: none;
        flex-direction: column;
        position: fixed;
        min-width: 100px;
        background-color: var(--box-color);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
        z-index: 20;
        /* top: 50px; */
        top: 0;
    }

    #drop-cell {
        color: var(--text-color);
        padding: 8px 10px;
        border-radius: 6px;
    }

    #drop-cell:hover {
        box-shadow: 1px 1px 2px 2px rgba(var(--shadow-color));
        cursor: pointer;
    }

    #dropbtn {
        cursor: pointer;
        align-self: center;
    }

    #dropbtn:hover {
        text-decoration: underline;
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
</style>
