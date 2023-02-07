<script lang="ts">
    import { goto } from "$app/navigation";
    import { unwrap } from "$lib/Alert";
    import { Access, type ChatRoom } from "$lib/types";
    import { post } from "$lib/Web";
    import Swal from "sweetalert2";
    import type { PageData } from "./$types";
    import ChatRoomBox from "./ChatRoomBox.svelte";
    import ChatroomDrawer from "./[room]/ChatroomDrawer.svelte";

	export let data: PageData;

    const joined = data.roomsJoined;
    const joinable = data.roomsJoinable;

    function enter(room: ChatRoom) {
        goto(`/room/${room.id}`);
    }

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

</script>

<ChatroomDrawer/>
<div class="room_list">
	<h1>Joined</h1>
	{#each joined as room}
		<ChatRoomBox {room} click={enter} joined={true}/>
	{/each}
	<h1>Joinable</h1>
	{#each joinable as room}
		<ChatRoomBox {room} click={join} joined={false}/>
	{/each}
</div>

<style>
	.room_list {
		display: flex;
		flex-direction: column;
		gap: 1em;
		margin: 1em;
	}
</style>
