<script lang="ts">
    import { getContext } from "svelte";

    type ButtonType = "button" | "submit" | "reset";

    const group = getContext("group");

    // export let pill: boolean = false;
    // export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = group ? 'sm' : 'md';
    export let href: string | undefined = undefined;
    export let btnClass: string | undefined = undefined;
    export let type: ButtonType = "button";

    let buttonClass: string;
    $: buttonClass = btnClass
        ? btnClass
        : "button";
</script>

<svelte:element
    this={href ? "a" : "button"}
    type={href ? undefined : type}
    {href}
    {...$$restProps}
    class={buttonClass}
    on:click
    on:change
    on:keydown
    on:keyup
    on:mouseenter
    on:mouseleave
>
        <slot />
</svelte:element>
