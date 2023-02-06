<script lang="ts">
    import type { Invite } from "$lib/types";
    import { post, remove } from "$lib/Web";
    import { invalidate } from "$app/navigation";
    import { page } from "$app/stores";
    import { BACKEND } from "$lib/constants";
    import {respond } from "$lib/invites";
    import {
        Tabs, 
        TabItem
     } from "flowbite-svelte";

    $: invites = {send: $page.data.invites_send, received: $page.data.invites_received};
    $: send = $page.data.invites_send;
    $: received = $page.data.invites_received;

    // async function respond(invite: Invite, action: string) {
    //     if (invite.type === "ChatRoom" || invite.type === "GameRoom") {
    //         if (action === "deny") {
    //             await remove(`/room/id/${invite.room?.id}/invite/${invite.id}`);
    //         }
    //         else {
    //             await post(`/room/id/${invite.room?.id}/members`);
    //             console.log("did a post here");
    //         }
    //     }
    //     else if (invite.type === "Friend") {
    //         if (action === "deny")
    //             await remove(`/user/me/friends/requests/${invite.id}`);
    //         else
    //             await post(`/user/me/friends/requests/`, {"id": invite.from.id}); 
    //     }
    //     // await invalidate(`${BACKEND}/user/me/invites`); //TODO thanks chen en daan for this stupid function that makes it properly update a component when it's data changes
    // }
</script>

<div class="invite_list">
    <Tabs style="underline" 
    divider
    defaultClass="flex flex-wrap space-x-2 bg-c rounded"
    contentClass="tab-content-background">

    <TabItem open={true} class="bg-c rounded" defaultClass="rounded"  title="send">
        <div>
            {#key $page.data.invites_send}
            {#each send as invite}
                <div class="invite">
                    <div>
                        {#if invite.to && invite.to.avatar}
                        <img class="avatar" src={invite.to.avatar} alt="">
                        {:else}
                            <img class="avatar" src="/avatar-default.png" alt="">
                        {/if}
                    </div>
                    <div>{invite.type} invitation to {invite.to.username}</div>
                    <div>
                        <button class="deny" on:click={() => respond(invite, "deny")}>Cancel</button>
                    </div>
                </div>
            {/each}
            {/key}
        </div>
    </TabItem>

    <TabItem open={false} class="bg-c rounded" defaultClass="rounded"  title="received">
        <div>
            {#key $page.data.invites_received}
            {#each received as invite}
                <div class="invite">
                    <div>
                        {#if invite.from && invite.from.avatar}
                            <img class="avatar" src={invite.from.avatar} alt="">
                        {:else}
                            <img class="avatar" src="/avatar-default.png" alt="">
                        {/if}
                    </div>
                    <div>{invite.type} invite from {invite.from.username}</div>
                    <div class="buttons">
                        <button class="confirm" on:click={() => respond(invite, "accept")}>Accept</button>
                        <button class="deny" on:click={() => respond(invite, "deny")}>Deny</button>
                    </div>
                </div>
            {/each}
            {/key}
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