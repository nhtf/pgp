<script lang="ts">
    import { page } from '$app/stores';
</script>

<div class="page">
    <div class="room justify-center">{$page.error?.message}</div>
</div>