<script lang="ts">
    import { onMount } from 'svelte';
    import { default_profile_image } from './+layout';
    
    let userlog: string = "lollllll";
    let show = false;

    function toggle_dropdown() {
        show = !show;
    }

    onMount(async () => {
        // userlog = await load();
    });
</script>

<nav>
    <div class="navbar">
        <a class="active" href="/">Home</a>
        <a href="/chat">Chat</a>
        <a href="/vrtest">VR Testing</a>
        <a href="http://localhost:3000/oauth/login">Login with Codam</a>
        <div class="fill"></div>

        <div class="dropdown">
            <button style="display:flex" on:click={toggle_dropdown}>
                {userlog}
                <img id="small-avatar" src={default_profile_image} alt="small-avatar" />
            </button>
            {#if show}
                <a href="/profile/{userlog}">profile</a>
                <a href="/settings">settings</a>
                <a href="/">logout</a>
            {/if}
        </div>
    </div>
</nav>

<slot />

<style>
    .navbar {
        background-color: rgb(223, 223, 223);
        display: flex;
        overflow: hidden;
        flex-wrap: wrap;
        font-size: 30px;
        padding: 15px;
        font-family: "Overpass", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    }

    .navbar a {
        color: black;
        font-size: inherit;
        padding: inherit;
        text-decoration: none;
    }

    .navbar a:hover {
        color: rgb(127, 127, 127);
    }

    .navbar button {
        border: none;
        background-color: inherit;
        display: flex;
        font-size: 30px;
        padding: 15px;
        text-decoration: none;
    }

    #small-avatar {
        display: flex;
        max-width: 35px;
        max-height: 35px;
        border-radius: 50%;
        margin-left: 5px;
    }

    .dropdown {
        background-color: inherit;
        font-size: inherit;
        padding: inherit;
        display: flex;
        align-self: flex-end;
        flex-direction: column;
        justify-self: flex-end;
        z-index: 1;
    }

    .fill {
        flex: auto;
    }

</style>
