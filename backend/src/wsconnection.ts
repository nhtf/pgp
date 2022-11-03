import { MessageBody, SubscribeMessage, WebSocketGateway, WsResponse, WebSocketServer, GatewayMetadata, ConnectedSocket, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@WebSocketGateway({ cors: { origin: 'http://0.0.0.0:8080', credentials: true } })
export class WSConnection {
	@WebSocketServer()
	server: Server;

	async handleConnection(client: Socket, ...args: any[]) {
		console.log('cookies: ' + client.handshake.headers.cookie);
		setInterval(() => client.emit('kaas', 'jouw kaas'), 1000);
	}

	@SubscribeMessage('kaas')
	async getKaas(@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<any> {
		console.log(data);
		if (!client.handshake.headers.cookie) {
			throw new WsException('forbidden');
		}
		return 'mijn kaas';
	}

	/*
	@SubscribeMessage('kaas')
	getHello(@MessageBody() data: any): Observable<WsResponse<string>> {
		return from('Hello World!').pipe(map(thing => ({ event: 'events', data: thing })));
	}
   */
}

