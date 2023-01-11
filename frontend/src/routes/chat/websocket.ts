import { io } from 'socket.io-client';

const WS = 'ws://localhost:3000';
const socket = io(WS, { withCredentials: true });

socket.on('exception', console.error);

export default socket;
