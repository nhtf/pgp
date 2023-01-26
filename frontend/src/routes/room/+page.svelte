<script lang="ts">
    import { FRONTEND } from "$lib/constants";
    import { unwrap } from '$lib/Alert';
    import { get, post } from '$lib/Web';
    import { Access, type ChatRoom } from "$lib/types";
    import type { PageData } from "./$types";
    import { error } from "@sveltejs/kit";
    import Swal from "sweetalert2";
    import { onMount } from "svelte/internal";
    import Room from "./Room.svelte";

    export let data: PageData;

	if (!data.user) {
		throw error(401, "Unauthorized");
	}

    let room_dto: any = {
        name: "",
        is_private: false,
    };

    let room_password = "";
    let mine = data.mine;
    let joinable = data.joinable;

    async function fetchChatRooms() {
        mine = await unwrap(get("/room/mine"));
        joinable = await unwrap(get("/room/joinable"));

    }

    async function createChatRoom() {
        if (room_password.length) {
            room_dto.password = room_password;
        }

        await unwrap(post("/room", room_dto));

        await fetchChatRooms();
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

    onMount(() => {
        window.fetch = data.fetch;
    });

</script>

<form class="room" style="margin: 1em;" on:submit|preventDefault={createChatRoom}>
    <input type="text" bind:value={room_dto.name} placeholder="Room name..."/>
    <input type="checkbox" bind:checked={room_dto.is_private}/>Private
    <input type="text" bind:value={room_password} placeholder="password..."/>
    <input type="submit" value="Create"/>
</form>
<div class="tab">
    <div class="room_list">
        {#each mine as chatroom}
            <Room room={chatroom} click={enter}/>
        {/each}
    </div>
    <div style="flex-grow: 1" ></div>
    <div class="room_list">
        {#each joinable as chatroom}
            <Room room={chatroom} click={join}/>
        {/each}
    </div>
</div>

<style>

.tab {
    display: flex;
    flex-direction: row;
}

.room_list {
    border-radius: 1em;
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 1em;
    gap: 1em;
    overflow: auto;
}

.room {
    background-color:steelblue;
    border-radius: 1em;
    display: flex;
    flex-direction: row;
    font-size: 1em;
    gap: 1em;
    padding: 1em;
}

.room input {
    border-radius: 1em;
}

</style>