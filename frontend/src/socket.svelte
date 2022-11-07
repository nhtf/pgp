<script lang="ts">
    import socket from './websocket';
    import SimpleChat from './SimpleChat.svelte';
    // import Messagebox from "./components/Messagebox.svelte";

    let selectedUser = '';

    const handleUserPicked = (e) => {
        // console.log("heyyyy");
        // console.log(e);
        let username = e.detail;
        socket.auth = { username };
        socket.connect();
        socket.emit('kaas', username, (response) => {console.log(response);});
        // fetch("/get-cookie/").then(response => {
        //     return response.text();
        // }).then(text => console.log(text));
        // console.log(document.cookie);
        selectedUser = username;
    };
</script>

<main>
    {#if selectedUser}
        <p>hello chickens</p>
        <!-- <SimpleChat on:username-picked={handleUserPicked} /> -->
    {:else}
       <SimpleChat on:username-picked={handleUserPicked} />
    {/if}


    <!-- <button onclick="window.location.href='http://0.0.0.0:3000/oauth/login';">Login with Codam
    </button> -->
</main>

<style>

</style>