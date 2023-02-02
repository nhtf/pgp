<script lang="ts">
    import type { PageData } from "./$types";
    import ChatroomDrawer from "./ChatroomDrawer.svelte";

    export let data: PageData;

</script>

<div class="drawer">
<ChatroomDrawer/>
<div class="title"><h1>Chat Rooms</h1></div>
</div>

<style>
    .drawer {
        display: flex;
        flex-direction: row;
        position: relative;
        align-items: center;
        top: 0.5rem;
        background-color: var(--box-color);
        width: 100vw;
        border-radius: 6px;
        box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
    }

    .title {
        margin: 0 auto;
    }

    h1 {
        font-size: 1.5rem;
        padding: 3px;
    }
</style>