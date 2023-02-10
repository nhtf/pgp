<script lang="ts">
    import { page } from "$app/stores";
    import type { Member } from "$lib/types";
    import { CloseButton, Drawer, ToolbarButton } from "flowbite-svelte";
    import { sineIn } from "svelte/easing";

	const members: Member[] = $page.data.members;

    let hidden = true; 
    let transitionParams = {
        x: 100,
        duration: 100,
        easing: sineIn,
    };

</script>

<ToolbarButton class="dots-menu bg-c" on:click={() => hidden = !hidden}>
    <img src="/Assets/icons/add-friend.png" alt="members" class="icon">
</ToolbarButton>
<Drawer placement="right" transitionParams={transitionParams} bind:hidden={hidden}>
	<CloseButton on:click={() => hidden = true}/>
</Drawer>

<style>
    .icon {
        width: 35px;
        height: 35px;
        -webkit-filter: var(--invert);
		filter: var(--invert);
    }
</style>