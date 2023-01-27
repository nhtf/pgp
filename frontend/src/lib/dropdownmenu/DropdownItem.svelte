<script lang="ts">


    export let href: string | undefined = undefined;

    let wrap: boolean = true;
  function init(node: HTMLElement) {
    wrap = node.parentElement?.tagName === 'UL';
  }
</script>


{#if show}
<svelte:element this={tag} use:use {...$$restProps}><slot /></svelte:element>
{:else}
<slot />
{/if}