<script lang="ts">
    import Swal from "sweetalert2";
    import { doFetch, FRONTEND, type Room } from "../../stores";

    export let data: {
        fetch: any,
        rooms: Room[],
    };

    const options = [
        "public",
        "private"
    ];

    let room_name = "";
    let password = "";
    let access = options[0];
    let rooms: Room[] = data.rooms;

    async function fetchRooms() {
        const response = await doFetch(data.fetch, "/room");

        if (!response.ok) {
            const error = await response.json();
        
           return Swal.fire({
                icon: "error",
                text: error.message,
            });
        }

       rooms = await response.json();
    }

    async function createRoom() {
        let room_dto: any = {
            "name": room_name,
            "access": access,
        };

        if (password.length > 0) {
            room_dto.password = password;
        }

        console.log(room_dto);

        const response = await doFetch(data.fetch, "/room", { method: "POST" }, room_dto);

        if (!response.ok) {
            const error = await response.json();

            return Swal.fire({
                icon: "error",
                text: error.message,
            });
        }
        fetchRooms();
    }

    function enter(id: number) {
        window.location.assign(FRONTEND + "/chat/" + id);
    }

</script>

<div class="room_list">
    <form class="room" on:submit|preventDefault={createRoom}>
        <input bind:value={room_name} type="text" placeholder="Room name..."/>
            {#each options as opt}
                <input bind:group={access} name="access" type="radio" value={opt}/>{opt}
            {/each}
            <input bind:value={password} type="text" placeholder="password..."/>
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