<script lang="ts">
    import { goto } from "$app/navigation";
    import { unwrap } from "$lib/Alert";
    import { Access, Action, Subject, type ChatRoom, type UpdatePacket } from "$lib/types";
    import { post } from "$lib/Web";
    import Swal from "sweetalert2";
    import type { PageData } from "./$types";
    import ChatRoomBox from "./ChatRoomBox.svelte";
    import {Checkbox} from "flowbite-svelte";
    import { onMount } from "svelte";
    import { updateManager } from "$lib/updateSocket";

    export let data: PageData;

    $: joined = data.roomsJoined;
    $: joinable = data.roomsJoinable;

	let password = "";

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

    function enter(room: ChatRoom) {
        goto(`/room/${room.id}`);
    }

    async function createChatRoom() {
        if (password.length) {
            room.password = password;
        }

        const created = await unwrap(post("/room", room));

        enter(created);
    };

    async function join(room: ChatRoom) {
        console.log("room: ",room);
        if (room.access == Access.PROTECTED) {
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

        Swal.fire({
            icon: "success",
            text: "Joined room",
        });
    
        goto(`/room/${room.id}`).catch((err) => console.log(err));
    }

    async function updateRooms(update: UpdatePacket) {
        if (update.action === Action.ADD) {
            joinable = [...joinable, update.value];
        }
        else if (update.action === Action.REMOVE) {
            joinable = joinable.filter((room) => room.id !== update.value.id);
            joined = joined.filter((room) => room.id !== update.value.id);
        }
    }

    onMount(() => {
        updateManager.add(Subject.ROOM, updateRooms);
    });

</script>

<div class="room_list">
    <div class="room room-create">
		<div>
			<input class="input" type="text" placeholder="Room name" bind:value={room.name}>
			<p/>
			<input class="input" type="password" autocomplete="off" placeholder="Room password" bind:value={password} disabled={room.is_private}>
			<Checkbox bind:checked={room.is_private} class="checkbox"></Checkbox>
			<span class="label">Private</span>
		</div>
		<button class="button button-create" on:click={createChatRoom}>Create</button>
	</div>
    {#key joined}
        {#each joined as room}
            <ChatRoomBox divider={false} {room} click={enter} joined={true}/>
        {/each}
    {/key}
    <div></div>
    {#key joinable}
        {#each joinable as room}
            <ChatRoomBox divider={false} {room} click={join} joined={false}/>
        {/each}
    {/key}
	
</div>

<style>
	.room_list {
		display: flex;
		flex-direction: column;
		gap: 1em;
		margin: 1em;
	}

    .room {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		background: var(--box-color);
		border: 2px var(--border-color);
		border-radius: 6px;
		padding: 25px;
	}

    .button {
		width: 80px;
		text-align: center;
	}

    .button, .input {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
	}

    .input:disabled {
		opacity: 0.25;
	}

	.button-create{
		border-color: var(--green);
	}

    p {
		margin-top: 0.375rem;
	}
</style>
