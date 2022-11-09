import { io } from 'socket.io-client';

const WS = 'ws://localhost:3000/chat'; //now for the chat namespace

const socket = io(WS, {withCredentials: true});

socket.on('exception', (e) => {
    console.log(e);
    console.log("error listener");
});

export default socket;
