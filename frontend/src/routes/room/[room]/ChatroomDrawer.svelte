<script lang="ts">
    import {Checkbox, Drawer, CloseButton, ToolbarButton, Tooltip } from "flowbite-svelte";
    import {sineIn} from "svelte/easing"
    import { page } from "$app/stores";
    import socket from "../websocket";
    import { unwrap } from '$lib/Alert';
    import { get, post } from '$lib/Web';
    import { Access, type ChatRoom, type Room } from "$lib/types";
    import Swal from "sweetalert2";
    import { goto } from "$app/navigation";
    import ChatRoomBox from "../ChatRoomBox.svelte";

    //TODO update the rooms using the update function (socket io)

    let createRoomShow = false;
    let hidden1 = true; 
    let transitionParams = {
        x: -320,
        duration: 200,
        easing: sineIn
    };
    let password = "";

    let joined: ChatRoom[] = $page.data.roomsJoined;
    let joinable: ChatRoom[] = $page.data.roomsJoinable;

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
        joined = await unwrap(get("/room", "member=true"));
        joinable = await unwrap(get("/room", "member=false"));
    
        return { joined, joinable };
    }

    async function createChatRoom() {
        if (password.length) {
            room.password = password;
        }

        const created = await unwrap(post("/room", room));

        enter(created);
    };

    function toggleCreateRoom() {
        createRoomShow = !createRoomShow;
    }

    async function enter(room: Room) {
        console.log(room);
        hidden1 = true;
        socket.emit("join", String(room.id));
        await goto(`/room/${room.id}`);
    }

    async function join(room: Room) {
        console.log("room: ",room);
        if (room.access == Access.PROTECTED) {
            //TODO replace the sweetalert for the password input stuff
            const { value: password, isDismissed } = await Swal.fire({
                text: "password",
                input: "password",
                inputPlaceholder: "password...",
            });

            if (isDismissed) {
                return ;
            }

            await unwrap(post(`/room/id/${room.id}/members`, { password }));
        } else {
            await unwrap(post(`/room/id/${room.id}/members`));
        }
        //TODO replace the sweetalert entering the room for flowbite one
        Swal.fire({
            icon: "success",
            text: "Joined room",
        });
        enter(room);
    }

</script>

<!-- //TODO style the input stuff -->
<ToolbarButton class="dots-menu bg-c"
    on:click={() => (hidden1 = !hidden1)}>
    <img src="/Assets/icons/chat.svg" alt="chat" class="icon">
</ToolbarButton>
    <Drawer 
        leftOffset="drawer-custom"
        transitionType="fly" {transitionParams} bind:hidden={hidden1} id='sidebar'
        divClass="z-50 p-4 bg-c w-auto">
        <div class='flex items-center'>
          <h5
            id="drawer-label"
            class="inline-flex items-center mb-4 text-base font-semibold text-gray-500 dark:text-gray-400">
            Chat Rooms
          </h5>
          <CloseButton on:click={() => (hidden1 = true)} class='mb-4 dark:text-white'/>
        </div>
        <div class="chat-room-plus" id="create-room-div"
            on:click={toggleCreateRoom} on:keypress={toggleCreateRoom}>
        <img src="/Assets/icons/plus.svg" alt="plus" class="icon">
        <Tooltip triggeredBy="[id='create-room-div']">Create Chat Room</Tooltip>
        </div>
        <div class="overflow-y-auto flex flex-col rooms">
        {#await fetchChatRooms()}
            <p>fetching data...</p>
        {:then value} 
            {#each value.joined as chatroom}
                <ChatRoomBox room={chatroom} click={enter} joined={true}/>
            {/each}
            {#each value.joinable as chatroom}
                <ChatRoomBox room={chatroom} click={join} joined={false}/>
            {/each}
        {/await}
        </div>
    </Drawer>
{#if createRoomShow}
    <div class="create-room">
        <div>
            <input class="input" placeholder="Room name" bind:value={room.name}>
            <!-- {#if !room.is_private} -->
                <input class="input" type="password" autocomplete="off" placeholder="password" bind:value={password} disabled={room.is_private}>
            <!-- {/if} -->
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

    .input:disabled {
        opacity: 0.25;
    }

    .chat-room-plus {
        display: flex;
        cursor: pointer;
        border-radius: 50%;
        border-width: 5px;
        border-color: transparent;
        align-items: center;
        width: 60px;
        height: 60px;
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
        cursor: pointer;
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