<script lang="ts">
    import { error } from "@sveltejs/kit";
    import { onMount } from "svelte";

    export let data: {
        fetch: any
    };

    const options = [
        "public",
        "protected",
        "private"
    ];

    let room_name = "";
    let password = "";
    let access = options[0];
    let rooms: any[] = [];
    $: rooms;

    onMount(fetchRooms);

    async function fetchRooms() {
        const endpoint = "http://localhost:3000/chat/rooms";
        const response = await data.fetch(endpoint, {
            credentials: "include",
            mode: "cors",
	    });

        if (!response.ok) {
            throw error(response.status, "Failed to load user rooms");
        }

        rooms = await response.json();
    }

    async function createRoom() {
        const endpoint = "http://localhost:3000/chat/create";

        let room_dto: any = {
            "name": room_name,
            "access": access,
        };

        if (access == "Protected") {
            room_dto.password = password;
        }

        let response = await data.fetch(endpoint, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(room_dto),
        });

        if (!response.ok) {
            return alert((await response.json()).message)
        }

        fetchRooms();
    }

    async function deleteRoom(id: number) {
        const endpoint = "http://localhost:3000/chat/delete";
        
        let response = await fetch(endpoint + "?id=" + id, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
        });

        if (!response.ok) {
            return alert((await response.json()).message)
        }
        
        fetchRooms();
    }

</script>

<ul class="room_list">
    <li>
        <form class="room" on:submit|preventDefault={createRoom}>
            <input
                bind:value={room_name}
                type="text"
                placeholder="Room name..."
            />
            {#each options as opt}
                <label>
                    <input
                        bind:group={access}
                        name="access"
                        type="radio"
                        value={opt}
                    />
                    {opt}
                </label>
                {#if access == "protected" && opt == "protected"}
                    <input
                        bind:value={password}
                        type="text"
                        placeholder="password..."
                    />
                {/if}
            {/each}
            <input type="submit" value="Create"/>
        </form>
    </li>
{#each rooms as room}
    <li>
        <ul class="room">
            <li><img id="small-avatar" src={room.owner.avatar} alt="avatar"/></li>
            <li>{room.name}</li>
            <li>{room.owner.username}</li>
            <li>{room.members.length}</li>
            <li>
                <form action={"/chat/" + room.id}>
                    <input type="submit" value="Go">
                </form>
            </li>
            <li>
                <form on:submit|preventDefault={() => deleteRoom(room.id)}>
                    <input type="submit" value="Delete">
                </form>
            </li>
        </ul>
    </li>
{/each}
</ul>

<style>

.room_list {
    border-radius: 1em;
    display: flex;
    flex-direction: column;
    gap: 1em;
    list-style: none;
}


.room {
    background-color:steelblue;
    border-radius: 1em;
    display: flex;
    flex-direction: row;
    font-size: 2em;
    padding: 1em;
    gap: 1em;
}

.room input {
    border-radius: 1em;
}

.room li {
    display: flex;
    list-style: none;
    flex-direction: row;
}

#small-avatar {
    border-radius: 1em;
    max-width: 1em;
    max-height: 1em;
}

</style>