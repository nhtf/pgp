<script lang="ts">
    import socket from './websocket';

    import { onMount } from "svelte";

    let textfield = "";
    let username = "";

    let messages: any[] = [];

    onMount(() => {

        socket.on('chatevent', message => { // Listen to the message event
            console.log(message);
            messages = [...messages, message]
        });

        socket.on('name', name => { // Another listener for the name:
            username = name // Update the name so it can be displayed
        });
        // socket.connect();
    })

    function sendMessage() {
        const message = textfield.trim()
        if(!message) {
            console.log("empyt");
            return;
        }
        console.log(message);
        textfield = ""
        socket.emit('chatevent', message, username) // Send the message

    }
</script>

<div class="h-screen w-screen bg-zinc-800">
    <div class="h-full w-full max-w-md mx-auto bg-zinc-500 flex flex-col">

        <header class="px-6 py-4 border-b border-zinc-800 bg-zinc-700 text-white shrink-0 flex items-center justify-between">
            <span>{username}</span>
        </header>

        <div class="h-full w-full p-4">
            {#each messages as message}
                <div class="bg-zinc-300 rounded-xl rounded-tl-none px-4 py-3 my-4 w-fit">
                    <span class="flex items-center space-between gap-4">
                        <b>{message.from}</b>
                        <i>{message.time}</i>
                    </span>
                    {message.message}
                </div>
            {/each}
        </div>

        <form action="#" on:submit|preventDefault={sendMessage}
            class="px-6 py-4 border-t border-zinc-800 bg-zinc-700 text-white shrink-0 flex items-center"
        >
            <input type="text" bind:value={textfield} placeholder="Type something..." class="bg-transparent border-none px-4 py-3 w-full" />
            <button type="submit" class="shrink-0 border border-white rounded-lg px-4 py-3">Send</button>
        </form>

    </div>
</div>

<a href='http://localhost:3000/oauth/login'>Login with Codam</a>

<style>

a:link, a:visited {
  background-color: white;
  color: black;
  border: 2px solid green;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
}

a:hover, a:active {
  background-color: green;
  color: white;
}

</style>

  