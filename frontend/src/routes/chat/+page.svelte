<script lang="ts">
    import Swal from "sweetalert2";
    import type { Room } from "./+page";

    export let data: {
        fetch: any,
        rooms: Room[]
    };

    const options = [
        "public",
        "protected",
        "private"
    ];

    let room_name = "";
    let password = "";
    let access = options[0];
    let rooms: Room[] = data.rooms;

    async function fetchRooms() {
        const URL = "http://localhost:3000/chat/rooms";
        const response = await fetch(URL, {
            credentials: "include",
        });

        if (!response.ok) {
           return Swal.fire({
                icon: "error",
                text: "Login to see user rooms",
            }).then(() => {
                window.location.replace("/profile"); // TODO: /login
            });
        }

       rooms = await response.json();
    }

    async function createRoom() {
        const URL = "http://localhost:3000/chat/create";

        let room_dto: any = {
            "name": room_name,
            "access": access,
        };

        if (access == "Protected") {
            room_dto.password = password;
        }

        const response = await data.fetch(URL, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            
            body: JSON.stringify(room_dto),
        });

        if (!response.ok) {
            const error = (await response.json()).message;
        
            return Swal.fire({
                icon: "error",
                text: error,
            });
        }

        fetchRooms();
    }

    async function deleteRoom(id: number) {
        const URL = "http://localhost:3000/chat/delete";
        const response = await data.fetch(URL + "?id=" + id, {
            method: "DELETE",
            credentials: "include",
        });

        if (!response.ok) {
            const error = (await response.json()).message;
        
            return Swal.fire({
                icon: "error",
                text: error,
            });
        }

        rooms = rooms.filter((room) => room.id != id);
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
            <li><img id="small-avatar" src={room.owner.avatar} alt=""/></li>
            <li>{room.owner.username}</li>
            <li style="width: 2em;">{room.members.length}</li>
            <li style="width: 8em;">{room.name}</li>
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
    margin: 1em;
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

.room li {
    display: flex;
    list-style: none;
    flex-direction: row;
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