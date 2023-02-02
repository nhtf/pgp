<script lang="ts">
    import { unwrap } from "$lib/Alert";
    import type { Invite, FriendRequest } from "$lib/types";
    import { get, post, remove } from "$lib/Web";
    import type { PageData } from "./$types";
    import {
        Tabs, 
        TabItem
     } from "flowbite-svelte";

	export let data: PageData;

    let send: Invite[] = [];
    let received: Invite[] = [];

    let invites = {send, received};

    function isFromUser(element: Invite) {
        return element.from.username === data.user?.username;
    }

    async function fetchInvites() {
        const room_invites: Invite[] = await unwrap(get("/user/me/invites"));
        const friend_requests: Invite[] = await get("/user/me/friends/requests");

        const room_send = room_invites.filter(isFromUser);
        const room_received = room_invites.filter((e) => !isFromUser(e));
        const friend_send = friend_requests.filter(isFromUser);
        const friend_received = friend_requests.filter((e) => !isFromUser(e));
        let send: Invite[] = [];
        let received: Invite[] = [];
        room_send?.forEach((invite) => {
            invite.type = "chat"
            send.push(invite)
        });
        friend_send?.forEach((request) => {
            request.type = "friend"
            send.push(request)
        });
        room_received?.forEach((invite) => {
            invite.type = "chat"
            received.push(invite)
        });
        friend_received?.forEach((request) => {
            request.type = "friend"
            received.push(request)
        });
        return {send, received}; 
    }

    async function respond(invite: Invite, action: string) {
        //TODO friend request accept/deny is different from room invite system
        if (action === "deny") {
            await unwrap(remove(`/room/id/${invite.room?.id}/invite`))
        }
        if (action === "accept") {
            await unwrap(post(`/room/id/${invite.room?.id}/invite`));
        }

        invites = await fetchInvites();
        
    }

    function fillInvites() {
        data.room_send?.forEach((invite) => {
            invite.type = "chat"
            send.push(invite)
        });
        data.friend_send?.forEach((request) => {
            request.type = "friend"
            send.push(request)
        });
        data.room_received?.forEach((invite) => {
            invite.type = "chat"
            received.push(invite)
        });
        data.friend_received?.forEach((request) => {
            request.type = "friend"
            received.push(request)
        });
        invites = {send, received};
    }
    fillInvites();

    console.log("send: ", send, "received: ", received);
</script>


<!-- //TODO use the type string of the invite (Backend + database needs to have that) -->
<div class="invite_list">
    <Tabs style="underline" 
    divider
    defaultClass="flex flex-wrap space-x-2 bg-c rounded"
    contentClass="tab-content-background">

    <TabItem open={true} class="bg-c rounded" defaultClass="rounded"  title="send">
        <div>
            {#if send}
            {#each send as invite}
                <div class="invite">
                    <div>
                        {#if invite.from && invite.from.avatar}
                        <img class="avatar" src={invite.from.avatar} alt="">
                        {:else}
                            <img class="avatar" src="/avatar-default.png" alt="">
                        {/if}
                    </div>
                    <div>{invite.type} request from {invite.from.username}</div>
                    <div>
                        <button class="deny" on:click={() => respond(invite, "deny")}>Cancel</button>
                    </div>
                </div>
            {/each}
            {/if}
        </div>
    </TabItem>

    <TabItem open={true} class="bg-c rounded" defaultClass="rounded"  title="received">
        <div>
            {#if received}
            {#each received as invite}
                <div class="invite">
                    <div>
                        {#if invite.from && invite.from.avatar}
                            <img class="avatar" src={invite.from.avatar} alt="">
                        {:else}
                            <img class="avatar" src="/avatar-default.png" alt="">
                        {/if}
                    </div>
                    <div>{invite.type} request from {invite.from.username}</div>
                    <div class="buttons">
                        <button class="confirm" on:click={() => respond(invite, "join")}>Accept</button>
                        <button class="deny" on:click={() => respond(invite, "deny")}>Deny</button>
                    </div>
                </div>
            {/each}
            {/if}
        </div>
    </TabItem>

    </Tabs>
    

    
</div>

<style>

.invite_list {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    position: relative;
    margin: 0 auto;
    width: 80%;
    top: 0.5rem;
    height: calc(100vh - 80px);
}

.invite {
    background-color:var(--box-color);
    /* border-radius: 6px; */
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0.875rem;
    justify-content: space-evenly;
    /* margin-top: 0.25rem; */
    font-size: 1.5rem;
    border-bottom-color: var(--border-color)!important;
    border-bottom-width: 2px;
}

.invite:hover {
    background-color: var(--box-hover-color);
}

.invite:first-child {
    margin-top: 0.25rem;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
}

.invite:last-child {
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
}

.invite button {
    display: inline-block;
    background: var(--box-color);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 1rem;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 100%;
}

.confirm {
    border: 1px solid var(--green)!important;
}

.confirm:hover, .deny:hover {
    background-color: var(--box-hover-color);
}

.deny {
    border: 1px solid var(--red)!important;
}

@media (max-width: 500px) {
        .invite_list {
            width: 100%;

        }

        .invite {
            font-size: 1rem;
        }

        .invite button {
            font-size: 0.875rem;
        }

        .avatar {
            width: 35px;
            height: 35px;
        }

        .buttons {
            flex-direction: column;
            display: flex;
            row-gap: 0.25rem;
        }
    }

</style>