import { io } from 'socket.io-client';
import { BACKEND_ADDRESS } from '$lib/constants';

const WS = "ws://" + BACKEND_ADDRESS + "/room";

export const roomSocket = io(WS, { withCredentials: true });
