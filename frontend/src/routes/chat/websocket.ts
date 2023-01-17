import { io } from 'socket.io-client';
import { BACKEND_ADDRESS } from '../../stores';

const WS = "ws://" + BACKEND_ADDRESS + "/room";
const socket = io(WS, { withCredentials: true });

socket.on('exception', console.error);

export default socket;
