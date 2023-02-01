<script lang="ts">
    import type { PageData } from "./$types";
    import ChatroomDrawer from "./ChatroomDrawer.svelte";

    export let data: PageData;

</script>

<div class="top-2 relative">
<ChatroomDrawer/>
</div>