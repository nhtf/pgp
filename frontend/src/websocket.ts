import { io } from 'socket.io-client';

const URL = "ws://0.0.0.0:3000/chat";

const socket = io(URL, {autoConnect: false, withCredentials: true});

// socket.io.on("ping", () => {
//     console.log("pinging");
// });

// socket.emit("hello", {a: "b", c: []});

socket.on("connect", () => {
    console.log("connect");
});

socket.onAny((event, ...args) => {
    // console.log(event, args);
    // console.log("ok");
});

socket.on('kaas', (event, ...args) => {
    // console.log("kaas listener");
    // console.log(event, args);
});

socket.on('pong', () => {
    console.log("pong listener");
});

socket.on('exception', () => {
    console.log("error listener");
});

export default socket;
