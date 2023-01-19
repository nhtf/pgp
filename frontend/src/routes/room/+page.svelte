<script lang="ts">
    import { FRONTEND } from "$lib/constants";
    import { unwrap } from '$lib/Alert';
    import { get, post } from '$lib/Web';
    import type { SerializedRoom } from "$lib/types";
    import type { PageData } from "./$types";

    export let data: PageData;

    const options = [
        "public",
        "private"
    ];

    let room_name = "";
    let room_password = "";
    let room_access = options[0];
    let rooms: SerializedRoom[] = data.rooms;

    async function fetchRooms(): Promise<SerializedRoom[]> {
        return await unwrap(get(fetch, "/room"));
    }

    async function createRoom() {
        let room_dto: any = {
            name: room_name,
            access: room_access,
            password: room_password,
        };

        await unwrap(post(fetch, "/room", room_dto));

        rooms = await fetchRooms();
    }

    function enter(id: number) {
        window.location.assign(`${FRONTEND}/room/${id}`);
    }

</script>

<div class="room_list">
    <form class="room" on:submit|preventDefault={createRoom}>
        <input bind:value={room_name} type="text" placeholder="Room name..."/>
            {#each options as opt}
                <input bind:group={room_access} name="access" type="radio" value={opt}/>{opt}
            {/each}
            {#if room_access === "public"}
                <input bind:value={room_password} type="text" placeholder="password..."/>
            {/if}
        <input type="submit" value="Create"/>
    </form>
{#each rooms as room}
    <button class="room" on:click={() => enter(room.id)}>
        <img id="small-avatar" src={room.owner.avatar} alt=""/>
        <div style="width: 4em;">{room.owner.username}</div>
        <div>{room.members.length}</div>
        <div>{room.name}</div>
    </button>
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

#small-avatar {
    border-radius: 1em;
    max-width: 1em;
    max-height: 1em;
}

</style>