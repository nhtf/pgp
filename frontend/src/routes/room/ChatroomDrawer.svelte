<script lang="ts">
    import {Checkbox, Drawer, CloseButton, ToolbarButton} from "flowbite-svelte";
    import {sineIn} from "svelte/easing"
    import { page } from "$app/stores";
    import Room from "./Room.svelte";
    import { unwrap } from '$lib/Alert';
    import { get, post } from '$lib/Web';
    import { Access, type ChatRoom } from "$lib/types";
    import { FRONTEND } from "$lib/constants";
    import Swal from "sweetalert2";

    let createRoomShow = false;
    let hidden1 = true; 
    let transitionParams = {
        x: -320,
        duration: 200,
        easing: sineIn
    };
    let activateClickOutside = false;
    let password = "";

    let mine = $page.data.mine;
    let joinable = $page.data.joinable;

    type room_dto = {
        name: string;
        is_private: boolean;
        password: string | undefined;
    };

    const room: room_dto = {
        name: "",
        is_private: false,
        password: undefined,
    };

    async function fetchChatRooms() {
        mine = await unwrap(get("/room/all"));
        // joinable = await unwrap(get("/room/joinable"));

    }

    async function createChatRoom() {
        if (password.length)
            room.password = password;
        await unwrap(post("/room", room));
        await fetchChatRooms();
        createRoomShow = false;
    };

    function toggleCreateRoom() {
        createRoomShow = !createRoomShow;
    }

    function enter(room: ChatRoom) {
        window.location.assign(`${FRONTEND}/room/${room.id}`);
    }

    async function join(room: ChatRoom) {
        if (room.access == Access.PROTECTED) {
            const { value: password, isDismissed } = await Swal.fire({
                text: "password",
                input: "password",
                inputPlaceholder: "password...",
            });

            if (isDismissed) {
                return ;
            }

            await unwrap(post(`/room/id/${room.id}/join`, { password }));
        } else {
            await unwrap(post(`/room/id/${room.id}/join`));
        }

        Swal.fire({
            icon: "success",
            text: "Joined room",
        });
    
       await fetchChatRooms();
    }

</script>


<ToolbarButton class="dots-menu bg-c"
  on:click={() => (hidden1 = !hidden1)}>
  <img src="/Assets/icons/chat.svg" alt="chat" class="icon">
</ToolbarButton>
<div class="room-container">
    <Drawer 
        
        leftOffset="drawer-custom"
        transitionType="fly" {transitionParams} bind:hidden={hidden1} id='sidebar'
        divClass="z-50 p-4 bg-c">
        <div class='flex items-center'>
          <h5
            id="drawer-label"
            class="inline-flex items-center mb-4 text-base font-semibold text-gray-500 dark:text-gray-400">
            Chat Rooms
          </h5>
          <CloseButton on:click={() => (hidden1 = true)} class='mb-4 dark:text-white'/>
        </div>
        <div class="chat-room-plus" 
            on:click={toggleCreateRoom} on:keypress={toggleCreateRoom}>
        <img src="/Assets/icons/plus.svg" alt="plus" class="icon" title="Create Chat Room">
        </div>
        <div class="overflow-y-auto flex flex-col rooms">
        {#each mine as chatroom}
            <Room room={chatroom} click={enter}/>
        {/each}
        {#each joinable as chatroom}
            <Room room={chatroom} click={join}/>
        {/each}
        </div>
    </Drawer>
</div>
{#if createRoomShow}
<div class="create-room">
    <div>
        <input class="input" placeholder="Room name" bind:value={room.name}>
        {#if room.is_private}
        <input class="input" placeholder="password" bind:value={password}>
        {/if}
        <br>
        <Checkbox bind:checked={room.is_private}>Private</Checkbox>
    </div>
    <div class="button button-create" on:click={createChatRoom}
        on:keypress={createChatRoom}>Create
    </div>
    <div class='close-button'>
    <CloseButton on:click={() => (createRoomShow = false)}/>
    </div>
</div>
{/if}

<style>
    .room-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 25px 10px;
	}

	.create-room {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		background: var(--box-color);
		border: 2px var(--border-color);
		border-radius: 6px;
		padding: 0.75rem;
        position: fixed;
        z-index: 51;
        top: 50%;
        left: 30%;
        box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
	}

    .chat-room-plus {
        display: flex;
        cursor: pointer;
        border-radius: 50%;
        border-width: 5px;
        border-color: transparent;
        align-items: center;
        width: 50px;
        height: 50px;
    }

    .chat-room-plus:hover {
        background-color: var(--box-hover-color);
    }

	.button, .input {
		display: inline-block;
        color: var(--text-color);
		background-color: var(--input-bkg-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
        margin-top: 0.25rem;
        margin-bottom: 0.25rem;
	}

	.button {
		width: 5rem;
		text-align: center;
	}

	.button-create {
		border-color: var(--green);
	}

	br {
		margin-bottom: 10px;
	}

    .icon {
        width: 50px;
        height: 50px;
        -webkit-filter: var(--invert);
		filter: var(--invert);
    }

    .rooms {
        height: calc(100% - 150px);
        padding-bottom: 25px;
        margin-top: 5px;
    }

    @media (max-width: 500px) {
        .create-room {
            width: 100%;
            left: 0;
        }
    }

</style>