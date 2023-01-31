<script lang="ts">
    import Dropdownmenu from '$lib/dropdownmenu.svelte';
    import { get, post } from '$lib/Web';
    import { io } from 'socket.io-client';
    import type { User } from "$lib/types";
    import Swal from "sweetalert2";
    import { page } from '$app/stores';
    import { BACKEND_ADDRESS } from '$lib/constants';
    import { onMount } from 'svelte/internal';
    import type {simpleuser} from "./+page";
    import { Button, Dropdown, DropdownItem, Avatar, DropdownHeader, DropdownDivider } from 'flowbite-svelte'

    //TODO check the store thing so it properly updates the page
    // const friends = writable($page.data.friendlist);
    //might need to change it back again to the export data thing
    let score = new Map();
    const friend_icon = "/Assets/icons/add-friend.png";
    let showFriendWindow = false;
    let username = "";
    let friends: simpleuser[];

    function checkGameScores() {
		let socket = io(`ws://${BACKEND_ADDRESS}/game`, {withCredentials: true});
		socket.on("connect", () => {socket.emit("join", {scope: "stat", room: "1"})});
		socket.on("status", (status) => {
            if (!$page.data.friendlist)
                return;
                $page.data.friendlist.forEach((user: User) => {
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
        console.log("friendlist: ", $page.data.friendlist);
	}

	checkGameScores();

    function toggleAddfriend() {
        showFriendWindow = !showFriendWindow;
    }

    async function addFriend() {
        let id: User;
        try {
            id = await get(`/user/${username}`);
        }
        catch (e) {
            const Toast = Swal.mixin({
				toast: true,
				showConfirmButton: false,
				timer: 3000,
				timerProgressBar: false,
				didOpen: (toast) => {
					toast.addEventListener("mouseenter", Swal.stopTimer);
					toast.addEventListener("mouseleave", Swal.resumeTimer);
				},
			});
			Toast.fire({
				icon: "error",
				title: "User does not exist",
			});
            return;
        }
        try {
            const id_obj = {"id" : id.id};
            const result = await post("/user/me/friends/requests", id_obj);
            const Toast = Swal.mixin({
				toast: true,
				showConfirmButton: false,
				timer: 3000,
				timerProgressBar: false,
				didOpen: (toast) => {
					toast.addEventListener("mouseenter", Swal.stopTimer);
					toast.addEventListener("mouseleave", Swal.resumeTimer);
				},
			});
			Toast.fire({
				icon: "success",
				title: "Friend request sent",
			});
            showFriendWindow = false;
            return;
        }
        catch (e: any) {
            const message: string = e.message;
            const error = message.substring(9);
            const Toast = Swal.mixin({
				toast: true,
				showConfirmButton: false,
				timer: 3000,
				timerProgressBar: false,
				didOpen: (toast) => {
					toast.addEventListener("mouseenter", Swal.stopTimer);
					toast.addEventListener("mouseleave", Swal.resumeTimer);
				},
			});
			Toast.fire({
				icon: "error",
				title: error,
			});
            console.log(e);
        }
    }

    onMount(() => {
        friends = $page.data.friendlist;
        let socket = io(`ws://${BACKEND_ADDRESS}/update`, {withCredentials: true});
        socket.on("update", async (status) => {
            friends.forEach((friend: simpleuser) => {
                if (friend.id === status.id) {
                    console.log("status: ", status);
                    console.log("friend status before: ", friend.status);
                    friend.status = status.status;
                    console.log("friend status after: ", friend.status);
                }
            });
            friends = friends;
        });
    });
    console.log($page.data.friendlist);
</script>

{#if showFriendWindow}
<div class="add-friend-window">
    <div class="close-button">
        <svg fill="currentColor" width="24" height="24"
            on:click={toggleAddfriend}
            on:keypress={toggleAddfriend}	
        >
            <path d="M13.42 12L20 18.58 18.58 20 12 13.42
                    5.42 20 4 18.58 10.58 12 4 5.42 5.42
                    4 12 10.58 18.58 4 20 5.42z"/>
        </svg>
    </div>
    <div class="image-selector">
        <input name="username" id="friend-selector" class="input-field" type="text" bind:value={username}/>
        <label for="image-selector_file_upload"></label>
    </div>
    <div class="image-selector" on:click={addFriend} on:keypress={addFriend}>add friend</div>
</div>
{/if}

<div class="block_cell self-flex-start background-color-custom bordered" id="friend-block">
    <div class="block_hor">
        <div class="block_cell">
            <h1 >Friends</h1>
        </div>
        <div class="block_cell" on:click={toggleAddfriend} on:keypress={toggleAddfriend}>
            <img class="small-avatars" src={friend_icon} alt="friend-icon" title="add friend">
            add friend
        </div>
    </div>
    <div class="block_vert width-available">
        {#if friends}
            {#each friends as { username, avatar, status, in_game, id }, index}
                <Button color="alternative" id="avatar_with_name{index}">
                    <Avatar src={avatar} class="mr-2"/>
                    <div class="block_cell">
                        <div class="block_hor">{username}</div>
                        {#if !in_game}
                            <div class="block_hor" id={status}>{status}</div>
                        {:else}
                            <div class="block_hor" id="in_game">playing</div>
                            {#if score.has(username)}
                                <div class="block_hor" id="scoredv">{score.get(username)}</div>
                            {/if}
                        {/if}
                    </div>
                </Button>
                <div class="spacing"></div>
                <Dropdown inline triggeredBy="#avatar_with_name{index}" class="border-color-custom background-color-custom"
                frameClass="border-color-custom background-color-custom">
                <DropdownItem href="/profile/{username}">view profile</DropdownItem>
                {#if in_game}
                    <DropdownItem>spectate</DropdownItem>
                {:else if status !== "offline"}
                    <DropdownItem>invite game</DropdownItem>
                {/if}
                <DropdownItem slot="footer">unfriend</DropdownItem>
                </Dropdown>
            {/each}
        {/if}
    </div>
</div>

<style>

    .width-available {
        width: -moz-available;
        width: -webkit-fill-available;
    }

    #friend-block {
        height: 100%;
    }

    .spacing {
        padding-top: 1px;

    }

    .input-field {
        border-radius: 6px;
		width: 300px;
		font-size: 35px;
		background: var(--bkg-color);
		color: var(--text-color);
		border-color: var(--border-color);
    }

    .add-friend-window {
        display: flex;
        position: fixed;
        flex-direction: column;
        z-index: 25;
		top: calc(50% - 201px);
		left: calc(50% - 176px);
        background: var(--box-color);
		border-radius: 6px;
		border-width: 1px;
		border-color: var(--border-color);
		border-style: solid;
		box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
		width: 400px;
		height: 350px;
		justify-content: space-between;
		align-items: center;
		text-align: center;
		align-self: flex-end;
    }

    .close-button {
		display: flex;
		position: relative;
		align-self: flex-end;
		align-items: center;
		justify-content: center;
		top: 10px;
		right: 10px;
		cursor: pointer;
	}

	.close-button:hover {
		box-shadow: 0 0 3px 2px var(--shadow-color);
		border-radius: 6px;
	}

    .image-selector {
		display: flex;
		position: relative;
		height: 30px;
		width: 100px;
		align-self: center;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		border-width: 1px;
		border-color: var(--scrollbar-thumb);
		border-style: solid;
		bottom: 20px;
		cursor: pointer;
	}

	.image-selector:hover {
		background: var(--tab-active-color);
	}

    .block_vert {
        flex-grow: 0.1;
        padding: 0;
        border: 0;
        height: 100%;
    }

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

.small-avatars {
    -webkit-filter: var(--invert);
    filter: var(--invert);
}

.avatar-cell {flex-grow: 1;}

#online,
#offline,
#in_game, #scoredv, #active, #idle {
    position: relative;
    font-size: small;
    cursor:default;
    padding: 0;
    /* top: -15px; */
}

#online, #active{color: var(--blue);}
#offline {color: var(--red);}
#idle {color: yellow;}
#in_game, #scoredv {color: var(--green);}

#scoredv {
    font-size: 10px;
    top: -5px;
}

#friend-hor {
    min-height: 55px;
    border: 2px solid var(--border-color);
}

.self-flex-start {
    align-self: flex-start;
}

@media (max-width: 750px) {
        .add-friend-window {
            width: 250px;
            height: 250px;
            top: calc(50% - 125px);
            left: calc(50% - 125px);
        }

        .input-field {
            width: 150px;
        }
    }
</style>