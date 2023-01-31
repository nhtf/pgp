<script lang="ts">
    import { unwrap } from "$lib/Alert";
    import type { Invite } from "$lib/types";
    import { get, post } from "$lib/Web";
    import type { PageData } from "./$types";
    import {page} from "$app/stores";

	export let data: PageData;
	
	let chat_invites: any[] = $page.data.invites;
    let friend_requests: any[] = $page.data.friend_requests;
    let invites: any = [];

    async function fetchInvites() {
        return await unwrap(get("/user/me/invites"));
    }

    async function respond(invite: Invite, action: string) {
        await unwrap(post(`/room/id/${invite.room.id}/${action}`));

        invites = await fetchInvites();
        
    }

    function fillInvites() {
        chat_invites.forEach((invite) => {
            invites.push({from: invite.from, type: "chat", room: invite.room})
        })
        friend_requests.forEach((request) => {
            invites.push({from: request.from, type: "friend"})
        });
    }
    fillInvites();

    console.log("invites: ", invites);
</script>

<div class="invite_list">
	{#each invites as invite}
		<div class="invite">
			<img id="small-avatar" src={invite.from.avatar} alt="">
			<div>{invite.type} request</div>
            <button class="confirm" on:click={() => respond(invite, "accept")}>Accept</button>
            <button class="deny" on:click={() => respond(invite, "deny")}>Deny</button>
        </div>
	{/each}
    </div>

<style>

.invite_list {
    border-radius: 1em;
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 1em;
    gap: 1em;
}

.invite {
    background-color:steelblue;
    border-radius: 1em;
    display: flex;
    flex-direction: row;
    font-size: 2em;
    gap: 1em;
    padding: 1em;
}

.invite button {
    display: inline-block;
    background: var(--box-color);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 1rem;
}

#small-avatar {
    border-radius: 1em;
    max-width: 1em;
    max-height: 1em;
}

.confirm {
    border-color: var(--confirm-color);
}

.deny {
    border-color: var(--cancel-color);
}

</style>