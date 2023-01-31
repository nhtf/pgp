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
    import {Checkbox} from "flowbite-svelte";

    export let data: PageData;

	if (!data.user) {
		throw error(401, "Unauthorized");
	}

    const room_dto: any = {
        name: "",
        is_private: false,
    };

    let password = "";

    let mine = data.mine;
    let joinable = data.joinable;

    async function fetchChatRooms() {
        mine = await unwrap(get("/room/all"));
        // joinable = await unwrap(get("/room/joinable"));

    }

    async function createChatRoom() {
        if (password.length)
            room_dto.password = password;
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

<div class="room-container">
	<div class="room room-create shadow">
		<div>
			<input class="input" placeholder="Room name" bind:value={room_dto.name}>
            {#if room_dto.is_private}
            <input class="input" placeholder="password" bind:value={password}>
            {/if}
            <br>
            <Checkbox bind:checked={room_dto.is_private}>Private</Checkbox>
		</div>
		<button class="button button-create" on:click={createChatRoom}>Create</button>
	</div>
	{#each mine as chatroom}
        <Room room={chatroom} click={enter}/>
    {/each}
    {#each joinable as chatroom}
        <Room room={chatroom} click={join}/>
    {/each}
</div>

<style>
.room-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 25px 10px;
	}

	.room {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		background: var(--box-color);
		border: 2px var(--border-color);
		border-radius: 6px;
		padding: 15px;
	}

	.button, .input {
		display: inline-block;
        color: var(--text-color);
		background-color: var(--input-bkg-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
	}

	.button {
		width: 80px;
		text-align: center;
	}

	.button-create {
		border-color: var(--green);
	}

	br {
		margin-bottom: 10px;
	}
</style>