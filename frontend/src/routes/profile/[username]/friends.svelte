<script lang="ts">
    import Dropdownmenu from '$lib/dropdownmenu.svelte';
    import { io } from 'socket.io-client';
    import type { PageData } from './$types';

    export let data: PageData;
    let friends = data.friendlist;
    let score = new Map();

    function checkGameScores() {
		let socket = io("ws://localhost:3000/game", {withCredentials: true});
		socket.on("connect", () => {socket.emit("join", {scope: "stat", room: "1"})});
		socket.on("status", (status) => {
			data.friendlist.forEach((user) => {
				if (status.players.length > 1 && status.teams.length > 1) {
					for (let i = 0; i < status.players.length; i+=1) {
                        if (status.players[i].user === user.id) {
                            const points = status.teams[0].score + " - " + status.teams[1].score;
                            score.set(user.username, points);
                        }
				    }
				}
			})
			score = score;
		});
	}

	checkGameScores();
</script>


<div class="block_vert">
    <h1 >Friends</h1>
    {#if friends}
        {#each friends as { username, avatar, online, in_game }}
            <div class="block_hor" id="friend-hor">
                <div class="block_cell">
                    <Dropdownmenu drop={{options: data.options.get(username), img: null}}/>
                    {#if online && !in_game}
                        <div class="block_hor" id="online">online</div>
                    {:else if !in_game}
                        <div class="block_hor" id="offline">offline</div>
                    {:else}
                        <div class="block_hor" id="in_game">playing</div>
                        {#if score.has(username)}
                        <div class="block_hor" id="scoredv">{score.get(username)}</div>
                        {/if}
                    {/if}
                </div>
                <div class="block_cell avatar-cell">
                    <Dropdownmenu drop={{options: data.options.get(username), img: avatar}}/>
                </div>				
            </div>
        {/each}
    {/if}
</div>

<style>
    .block_vert {flex-grow: 0.1;}

.block_hor {width: 90%;}

.block_cell {
    flex-direction: column;
    min-width: 100px;
    min-height: 40px;
    padding: 5px;
}

.block_cell:first-child {
    flex-grow: 1;
    text-align: center;
}

.avatar-cell {flex-grow: 1;}

#online,
#offline,
#in_game, #scoredv {
    position: relative;
    font-size: small;
    cursor:default;
    padding: 0;
}

#online{color: #5193af;}
#offline {color: rgb(250, 93, 93);}
#in_game, #scoredv {color: #88c5a4;}

#scoredv {
    font-size: 10px;
    top: -5px;
}

#friend-hor {
    min-height: 55px;
    border: 2px solid var(--border-color);
}
</style>