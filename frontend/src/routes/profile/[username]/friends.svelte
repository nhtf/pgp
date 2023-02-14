<script lang="ts">
    import { get, post, remove } from '$lib/Web';
    import { io } from 'socket.io-client';
    import { Action, Status, Subject, type User } from "$lib/types";
    import Swal from "sweetalert2";
    import { page } from '$app/stores';
    import { BACKEND_ADDRESS } from '$lib/constants';
    import { onDestroy, onMount } from 'svelte/internal';
    import type { simpleuser } from "./+page";
    import { Button, Dropdown, DropdownItem, Avatar } from 'flowbite-svelte'
    import { updateManager } from "$lib/updateSocket";
    import { userStore } from '../../../stores';
	import "@sweetalert2/theme-dark/dark.scss";

    const friend_icon = "/Assets/icons/add-friend.png";
	const status_colors = [ "gray", "yellow", "green" ];

    let score = new Map();
    let showFriendWindow = false;
    let username = "";

	let profile: User = $page.data.profile;
    let friends: User[];
    $: friends = $page.data.friends;
    $: placement = window.innerWidth < 750 ? "top" : "left-end";

    onMount(() => {
		userStore.update((users) => {
			users.set(profile.id, profile);
			friends.forEach((friend) => {
				users.set(friend.id, friend);
			});
		
			return users;
		});

		userStore.subscribe((users) => {
			friends = friends.map((friend) => users.get(friend.id) as User);
		})

        updateManager.set(Subject.FRIENDS, updateFriends);
    });

    onDestroy(() => {
        updateManager.remove(Subject.FRIENDS);
    })
    
    function checkGameScores() {
		let socket = io(`ws://${BACKEND_ADDRESS}/game`, { withCredentials: true });
    
		socket.on("connect", () => { socket.emit("join", { scope: "stat", room: "1" }) });
		socket.on("status", (status) => {
            console.log(status);
            if (!$page.data.friendlist)
                return;
            $page.data.friendlist?.forEach((user: User) => {
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
        // console.log("friendlist: ", $page.data.friendlist);
	}

	// checkGameScores();

    async function toggleAddfriend() {
		await Swal.fire({
			title: "Add friend",
			input: "text",
			showCancelButton: true,
			confirmButtonText: "Add friend",
			confirmButtonColor: "var(--confirm-color)",
			cancelButtonColor: "var(--cancel-color)",
			background: "var(--box-color)",
			showLoaderOnConfirm: true,
			inputAutoTrim: true,
			inputPlaceholder: "Enter username",
			allowOutsideClick: () => !Swal.isLoading(),
			inputValidator: (username) => {
				if (username.length < 3 || username.length > 20)
					return "Username must be be 3-20 characters";
				if (!/^(?!\0)\S(?:(?!\0)[ \S]){1,18}(?!\0)\S$/.test(username))
					return "Invalid characters";
				if (username === $page.data.user.username)
					return "Cannot befriend yourself";
                return null;
			},
			preConfirm: async (username) => {
				return get(`/user/${encodeURIComponent(username)}`).then(async target => {
					await post("/user/me/friends/requests", { id: target.id });
					return null;
				}).catch(error => {
					Swal.showValidationMessage(error.message);
				});
			},
		}).then(result => {
			if (result.isConfirmed) {
				Swal.fire({
					position: "top-end",
					icon: "success",
					title: "Successfully sent friend request",
					showConfirmButton: false,
					timer: 1300,
				});
			}
		});
        //showFriendWindow = !showFriendWindow;
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

    async function removeFriend(id: number) {
        await remove(`/user/me/friends/${id}`);
        //TODO have a toast or alert or something to show it was fine.
    }

    function updateFriends(update: any) {
        console.log("updatefriend function");
        if (update.action === Action.ADD) {
            const newFriend: simpleuser = {
                id: update.value.id,
                username: update.value.username,
                avatar: update.value.avatar,
                status: update.value.status,
                in_game: false,
            }
            friends.push(newFriend);
            friends = friends;
        }
        else if (update.action === Action.REMOVE) {
            friends = friends.filter((friend) => friend.id !== update.value.id);
        }
    }

    function changePlacement() {
        if (window.innerWidth < 550) {
            placement = "top";
        }
        else
            placement = "left-end";
    }
</script>

<svelte:window on:resize={changePlacement}/>

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
        <input 
            name="username" 
            id="friend-selector" 
            class="input-field" 
            type="text" 
            placeholder="username..."
            bind:value={username}/>
        <label for="image-selector_file_upload"></label>
    </div>
    <div class="image-selector" on:click={addFriend} on:keypress={addFriend}>add friend</div>
</div>
{/if}

<div class="block-cell self-flex-start bg-c bordered" id="friend-block">
    <div class="block-hor">
        <div class="block-cell">
            <h1>Friends</h1>
        </div>
        <div class="block-cell" on:click={toggleAddfriend} on:keypress={toggleAddfriend}>
            <img class="small-avatars" src={friend_icon} alt="friend-icon" title="add friend">
            add friend
        </div>
    </div>
    <div class="block-vert width-available">
        {#if friends}
        {#key friends}
            {#each friends as { username, avatar, status, in_game, id }, index}
                <Button color="alternative" id="avatar_with_name{index}"
                    class="friend-button">
                    <Avatar
                        src={avatar}
                        dot={{
                            placement: "bottom-right",
			                color: status_colors[status],
                        }}
                        class="mr-2"
                    />
                    <div class="block-cell">
                        <div class="block-hor">{username}</div>
                        {#if in_game}
                            <div class="block-hor" id="in_game">playing</div>
                            {#if score.has(username)}
                                <div class="block-hor" id="scoredv">{score.get(username)}</div>
                            {/if}
                        {/if}
                    </div>
                </Button>
                <div class="spacing"></div>
                <Dropdown {placement} inline triggeredBy="#avatar_with_name{index}" class="bor-c bg-c"
                frameClass="bor-c bg-c">
                <DropdownItem  href="/profile/{encodeURIComponent(username)}">view profile</DropdownItem>
                <!-- //TODO make the spectate and invite game actually functional -->
                {#if in_game}
                    <DropdownItem >spectate</DropdownItem>
                {:else if status !== Status.OFFLINE}
                    <DropdownItem >invite game</DropdownItem>
                {/if}
                <DropdownItem  on:click={() => removeFriend(id)} slot="footer">unfriend</DropdownItem>
                </Dropdown>
            {/each}
            {/key}
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
        margin-bottom: unset;
        left: unset;
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

    .block-vert {
        flex-grow: 0.1;
        padding: 0;
        border: 0;
        height: 100%;
    }

.block-cell {
    flex-direction: column;
    min-width: 100px;
    min-height: 40px;
    padding: 5px;
}

.block-cell:first-child {
    flex-grow: 1;
    text-align: center;
}

.small-avatars {
    -webkit-filter: var(--invert);
    filter: var(--invert);
}

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
#idle {color: var(--yellow);}
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
