<script lang="ts">
    // export let open: boolean = false;
    // export let frameClass: string = '';

    $: {
    // set default values
    $$restProps.arrow = $$restProps.arrow ?? false;
    $$restProps.trigger = $$restProps.trigger ?? 'click';
    $$restProps.placement = $$restProps.placement ?? 'bottom';
    $$restProps.color = $$restProps.color ?? 'dropdown';
    $$restProps.shadow = $$restProps.shadow ?? true;
    $$restProps.rounded = $$restProps.rounded ?? true;
  }
</script>

{#if $$slots.header}
    <div class="py-1 overflow-hidden rounded-t">
      <slot name="header" />
    </div>
  {/if}
  <ul class={$$props.class ?? 'py-1 w-44'}>
    <slot />
  </ul>
  {#if $$slots.footer}
    <div class="py-1  overflow-hidden rounded-b">
      <slot name="footer" />
    </div>
  {/if}

