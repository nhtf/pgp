<script lang="ts">
    export let data: { rooms: any[] };

    const options = [
        "public",
        "protected",
        "private"
    ];

    let room_name = "";
    let password = "";
    let access = options[0];
    let rooms: any[] = data.rooms;

    async function createRoom() {
        const endpoint = "http://localhost:3000/chat/create";

        let room_dto: any = {
            "name": room_name,
            "access": access,
        };

        if (access == "Protected") {
            room_dto.password = password;
        }

        let response = await fetch(endpoint, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(room_dto),
        });

        if (!response.ok) {
            alert((await response.json()).message)
        }
    }

    async function deleteRoom(id: number) {
        const endpoint = "http://localhost:3000/chat/delete";
        
        let room_dto = "id=" + JSON.stringify(id);
    
        console.log(room_dto);

        let response = await fetch(endpoint, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: room_dto,
        });

        if (!response.ok) {
            alert((await response.json()).message)
        }
    }

</script>

<form on:submit|preventDefault={createRoom}>
    <div>
        <input
            bind:value={room_name}
            type="text"
            placeholder="Room name..."
        />
    </div>
    {#each options as opt}
        <div>
            <label>
                <input
                    bind:group={access}
                    name="access"
                    type="radio"
                    value={opt}
                />
                {opt}
            </label>
        </div>
        {#if access == "protected" && opt == "protected"}
            <div>
                <input
                    bind:value={password}
                    type="text"
                    placeholder="password..."
                />
            </div>
        {/if}
    {/each}

    <button type="submit">Create</button>
</form>

<form on:submit|preventDefault={deleteRoom}>
    <div>
        <input
            bind:value={room_name}
            type="text"
            placeholder="Room name..."
        />
    </div>
    <button type="submit">Delete</button>
</form>

<ul class="room_preview">
    <h1>Rooms:</h1>
    {#each rooms as room}
        <li>
            <ul class="room_preview_strings">
                <li>NAME: {room.name}</li>
                <li>OWNER: {room.owner.username}</li>
                <li>MEMBERS: {room.members.length}</li>
            </ul>
            <button class="room_preview" on:click={() => deleteRoom(room.id)}>Delete</button>
        </li>
    {/each}
</ul>

<style>

.room_preview {
    /* background-color: cornflowerblue; */
    padding: 1em;
}

.room_preview li {
    display: flex;
    justify-content: center;
    background-color: cadetblue;
    padding: 1em;
    border-radius: 1em;
    list-style: none;
}

.room_preview button {
    color: brown;
}

.room_preview_strings {
    display: flex;
    flex-direction: column;

    justify-content: flex-start;
    padding: 1em;
}

</style>