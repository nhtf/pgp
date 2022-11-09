import { MessageBody, SubscribeMessage, WebSocketGateway, WsResponse, WebSocketServer, GatewayMetadata, ConnectedSocket, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@WebSocketGateway({ cors: { origin: 'http://localhost:5173', credentials: true }, namespace: 'chat' })
export class WSConnection {
	clients: Socket[] = [];
	@WebSocketServer()
	server: Server;

	async handleConnection(client: Socket, ...args: any[]) {
		this.clients.push(client);
		console.log('cookies: ' + client.handshake.headers.cookie);
		let username = `User ${Math.round(Math.random() * 999999)}`;
        client.emit('name', username);
		// setInterval(() => client.emit('chat', 'jouw kaas'), 1000);
	}

	@SubscribeMessage('chatevent')
	async getKaas(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		console.log(data);
		console.log("chatevent backend");
		if (!client.handshake.headers.cookie) {
			console.log("forbidden");
			throw new WsException('forbidden');
		}
		console.log("returning");
		this.clients.forEach((client) => {
			client.emit("chatevent", {
				from: data[1],
				message: data[0],
				time: new Date().toLocaleString()
			});
		})	
	}

	@SubscribeMessage('moveEvent')
	async getMovement(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		console.log(data);
		console.log("moveEvent backend");
		// if (!client.handshake.headers.cookie) {
		// 	console.log("forbidden");
		// 	throw new WsException('forbidden');
		// }
		// console.log("returning");
		// this.clients.forEach((client) => {
		// 	client.emit("chatevent", {
		// 		from: data[1],
		// 		message: data[0],
		// 		time: new Date().toLocaleString()
		// 	});
		// })	
	}

	@SubscribeMessage('name')
	async getName(@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<any> {
		console.log(data);
		if (!client.handshake.headers.cookie) {
			console.log("forbidden");
			throw new WsException('forbidden');
		}
		return 'name';
	}

	/*
	@SubscribeMessage('kaas')
	getHello(@MessageBody() data: any): Observable<WsResponse<string>> {
		return from('Hello World!').pipe(map(thing => ({ event: 'events', data: thing })));
	}
   */
}

