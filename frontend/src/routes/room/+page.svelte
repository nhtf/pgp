<script lang="ts">
    import { FRONTEND } from "$lib/constants";
    import { unwrap } from '$lib/Alert';
    import { get, post } from '$lib/Web';
    import { Access, type Room, type User } from "$lib/types";
    import type { PageData } from "./$types";
    import { error } from "@sveltejs/kit";
    import Swal from "sweetalert2";

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
    let rooms: Room[] = data.rooms;

    console.log(data.rooms);

    async function fetchRooms(): Promise<Room[]> {
        return await unwrap(get("/room"));
    }

    async function createRoom() {
        if (room_password.length) {
            room_dto.password = room_password;
        }

        console.log(room_dto);

        await unwrap(post("/room", room_dto));

        rooms = await fetchRooms();
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
    
        rooms = await fetchRooms();
    }

</script>

<div class="room_list">
    <form class="room" on:submit|preventDefault={createRoom}>
        <input type="text" bind:value={room_dto.name} placeholder="Room name..."/>
        <input type="checkbox" bind:checked={room_dto.is_private}/>Private
        <input type="text" bind:value={room_password} placeholder="password..."/>
        <input type="submit" value="Create"/>
    </form>
{#each rooms as room}
    {#if data.user && isMember(data.user, room)}
        <button class="room" on:click={() => enter(room.id)}>
            <img id="small-avatar" src={room.owner.avatar} alt=""/>
            <div style="width: 4em;">{room.owner.username}</div>
            <div>{room.members.length}</div>
            <div>{room.name}</div>
            {#if room.access == Access.PROTECTED}
                <svg>
                    <circle cx="25" cy="25"></circle>
                    <div style="mask-image: url({lock});"></div>
                </svg>
            {/if}
        </button>
    {:else}
        <div class="room">
            <img id="small-avatar" src={room.owner.avatar} alt=""/>
            <div style="width: 4em;">{room.owner.username}</div>
            <div>{room.members.length}</div>
            <div>{room.name}</div>
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