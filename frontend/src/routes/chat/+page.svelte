<script lang="ts">
    import socket from "./websocket";
    import { onMount } from "svelte";
    import "../+layout.svelte";

    let textfield = "";
    let username = "";
    let messages: any[] = [];

    onMount(() => {
        socket.on("chatevent", (message) => {
            // Listen to the message event
            console.log(message);
            messages = [...messages, message];
        });

        socket.on("name", (name) => {
            // Another listener for the name:
            username = name; // Update the name so it can be displayed
        });
        // socket.connect();
    });

    function sendMessage() {
        const message = textfield.trim();
        if (!message) {
            console.log("empty");
            return;
        }
        console.log(message);
        textfield = "";
        socket.emit("chatevent", message, username); // Send the message
    }
</script>

<form
    action="#"
    on:submit|preventDefault={sendMessage}>
    <input
        type="text"
        bind:value={textfield}
        placeholder="Type something..."
        class="bg-transparent border-none px-4 py-3 w-full"
    />
    <button
        type="submit"
        class="shrink-0 border border-white rounded-lg px-4 py-3"
        >Send</button
    >
</form>
