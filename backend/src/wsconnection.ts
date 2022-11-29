import { MessageBody, SubscribeMessage, WebSocketGateway, WsResponse, WebSocketServer, GatewayMetadata, ConnectedSocket, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@WebSocketGateway({ cors: { origin: 'http://localhost:5173', credentials: true } })
export class WSConnection {
	@WebSocketServer()
	server: Server;

	// async handleConnection(client: Socket, ...args: any[]) {
	// 	console.log('cookies: ' + client.handshake.headers.cookie);
	// 	setInterval(() => client.emit('kaas', 'jouw kaas'), 1000);
	// }

	// @SubscribeMessage('kaas')
	// async getKaas(@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<any> {
	// 	console.log(data);
	// 	if (!client.handshake.headers.cookie) {
	// 		throw new WsException('forbidden');
	// 	}
	// 	return 'mijn kaas';
	// }
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

	/*
	@SubscribeMessage('kaas')
	getHello(@MessageBody() data: any): Observable<WsResponse<string>> {
		return from('Hello World!').pipe(map(thing => ({ event: 'events', data: thing })));
	}
   */
}

