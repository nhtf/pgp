import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: 'http://localhost:5173', credentials: true } })
export class WSConnection {
	@WebSocketServer()
	server: Server;

	users: string[];
	constructor() {
		this.users = [];
	}

	@SubscribeMessage("broadcast")
	async broadcast(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		client.broadcast.emit("broadcast", data);
	}

	@SubscribeMessage("joinGame")
	joinGame(@MessageBody() data: string): boolean {
		if (this.users.find(id => id === data) === undefined) {
			this.users.push(data);
			return true;
		}
		return true;
	}

	@SubscribeMessage("getPlayerInfo")
	async getPlayerInfo(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		return 
	}

	@SubscribeMessage("sendMessage")
	sendMessage(@MessageBody() body: string) {
		console.log("Body: " + body);
	}
}

