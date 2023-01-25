<script lang="ts">
    import { unwrap } from "$lib/Alert";
    import type { Invite } from "$lib/types";
    import { get, post } from "$lib/Web";
    import type { PageData } from "./$types";

	export let data: PageData;
	
	let invites = data.invites;

    async function fetchInvites() {
        return await unwrap(get("/user/me/invites"));
    }

    async function respond(invite: Invite, action: string) {
        await unwrap(post(`/room/id/${invite.room.id}/${action}`));

        invites = await fetchInvites();
    }

</script>

<div class="invite_list">
	{#each invites as invite}
		<div class="invite">
			<img id="small-avatar" src={invite.from.avatar} alt="">
			<div>{invite.room.name}</div>
            <button on:click={() => respond(invite, "accept")}>Accept</button>
            <button on:click={() => respond(invite, "deny")}>Deny</button>
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
    border-radius: 1em;
}

#small-avatar {
    border-radius: 1em;
    max-width: 1em;
    max-height: 1em;
}

</style>