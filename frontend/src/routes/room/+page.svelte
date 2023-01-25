<script lang="ts">
    import { FRONTEND } from "$lib/constants";
    import { unwrap } from '$lib/Alert';
    import { get, post } from '$lib/Web';
    import { Access, type Room, type User } from "$lib/types";
    import type { PageData } from "./$types";
    import { error } from "@sveltejs/kit";
    import Swal from "sweetalert2";
    import { onMount } from "svelte/internal";

    const lock = "/Assets/icons/lock.svg";

    export let data: PageData;

	if (!data.user) {
		throw error(401, "Unauthorized");
	}

    const user = data.user;

    let room_dto: any = {
        name: "",
        is_private: false,
    };

    let room_password = "";
    let my_rooms: Room[] = data.my_rooms;

    async function fetchMyRooms(): Promise<Room[]> {
        return await unwrap(get("/room/mine"));
    }

    async function createRoom() {
        if (room_password.length) {
            room_dto.password = room_password;
        }

        console.log(room_dto);

        await unwrap(post("/room", room_dto));

        my_rooms = await fetchMyRooms();
    }

    function enter(id: number) {
        window.location.assign(`${FRONTEND}/room/${id}`);
    }

    function isMember(me: User, room: Room) {
        const members = room.members;
        const users = members.map((member) => member.user);
        const index = users.findIndex((user) => user.id === me.id);

        return index >= 0;
    }

    async function join(room: Room) {
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
    
        my_rooms = await fetchMyRooms();
    }

    onMount(() => {
        window.fetch = data.fetch;
    });

</script>

<div class="room_list">
    <form class="room" on:submit|preventDefault={createRoom}>
        <input type="text" bind:value={room_dto.name} placeholder="Room name..."/>
        <input type="checkbox" bind:checked={room_dto.is_private}/>Private
        <input type="text" bind:value={room_password} placeholder="password..."/>
        <input type="submit" value="Create"/>
    </form>
    <h1>Mine</h1>
        {#each my_rooms as room}
            {#if data.user && isMember(data.user, room)}
                <button class="room" on:click={() => enter(room.id)}>
                    <img id="small-avatar" src={room.owner.avatar} alt=""/>
                    <div style="width: 4em;">{room.owner.username}</div>
                    <div>{room.members.length}</div>
                    <div>{room.name}</div>
                    {#if room.access == Access.PROTECTED}
                        <img src={lock} alt="lock" style="max-width: 1em;">
                    {/if}
                </button>
            {:else}
                <div class="room">
                    <img id="small-avatar" src={room.owner.avatar} alt=""/>
                    <div style="width: 4em;">{room.owner.username}</div>
                    <div>{room.members.length}</div>
                    <div>{room.name}</div>
                    {#if room.access == Access.PROTECTED}
                        <img src={lock} alt="lock" style="max-width: 1em;">
                    {/if}
                    <button on:click={() => join(room)}>Join</button>
                </div>
            {/if}
        {/each}
    <h1>Visible</h1>
        {#each data.visible_rooms as room}
            {#if data.user && isMember(data.user, room)}
                <button class="room" on:click={() => enter(room.id)}>
                    <img id="small-avatar" src={room.owner.avatar} alt=""/>
                    <div style="width: 4em;">{room.owner.username}</div>
                    <div>{room.members.length}</div>
                    <div>{room.name}</div>
                    {#if room.access == Access.PROTECTED}
                        <img src={lock} alt="lock" style="max-width: 1em;">
                    {/if}
                </button>
            {:else}
                <div class="room">
                    <img id="small-avatar" src={room.owner.avatar} alt=""/>
                    <div style="width: 4em;">{room.owner.username}</div>
                    <div>{room.members.length}</div>
                    <div>{room.name}</div>
                    {#if room.access == Access.PROTECTED}
                        <img src={lock} alt="lock" style="max-width: 1em;">
                    {/if}
                    <button on:click={() => join(room)}>Join</button>
                </div>
            {/if}
        {/each}
</div>

<style>

.room_list {
    border-radius: 1em;
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 1em;
    gap: 1em;
    overflow: scroll;
}

.room {
    background-color:steelblue;
    border-radius: 1em;
    display: flex;
    flex-direction: row;
    font-size: 2em;
    gap: 1em;
    padding: 1em;
}

.room input {
    border-radius: 1em;
}

.room button {
    border-radius: 1em;
}

#small-avatar {
    border-radius: 1em;
    max-width: 1em;
    max-height: 1em;
}

</style>