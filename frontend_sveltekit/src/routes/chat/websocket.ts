import { io } from 'socket.io-client';

const WS = 'ws://localhost:3000/chat'; //now for the chat namespace

const socket = io(WS, {withCredentials: true});

// socket.io.on("ping", () => {
//     console.log("pinging");
// });

// socket.emit("hello", {a: "b", c: []});

// socket.on("connect", () => {
//     console.log("connect");
// });

// socket.onAny((event, ...args) => {
//     // console.log(event, args);
//     // console.log("ok");
// });

// socket.on('chat', (event, ...args) => {
//     console.log("chat listener");
//     console.log(event, args);
// });

// socket.on('chatevent', (event, ...args) => {
//     console.log("chatevent listener");
//     console.log(event, args);
// });

socket.on('exception', (e) => {
    console.log(e);
    console.log("error listener");
});

export default socket;
