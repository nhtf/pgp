import { HttpException, HttpStatus, Inject } from '@nestjs/common';
import {
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { authorize } from 'src/auth/auth.guard';
import { ChatRoom } from 'src/entities/ChatRoom';
import { Message } from 'src/entities/Message';
import { User } from 'src/entities/User';
import { FRONTEND_ADDRESS } from 'src/vars';
import { Repository } from 'typeorm';

@WebSocketGateway({
	namespace: "room",
	cors: { origin: FRONTEND_ADDRESS, credentials: true },
})
export class RoomGateway {
	@WebSocketServer()
	server: Server;

	constructor(
		@Inject('CHATROOM_REPO')
		private readonly roomRepo: Repository<ChatRoom>,
		@Inject('USER_REPO')
		private readonly userRepo: Repository<User>,
		@Inject('MESSAGE_REPO')
		private readonly messageRepo: Repository<Message>
	) {}

	async handleConnection(client: Socket) {
		const request: any = client.request;
	
		if (!request.session || !authorize(request.session)) {
			client.emit('exception', { errorMessage: 'unauthorized' });
			client.disconnect();
		}
	}

	@SubscribeMessage('join')
	join(@ConnectedSocket() client: Socket, @MessageBody() id: string) {
		client.room = id;
		
		client.join(id);
	}

	@SubscribeMessage('message')
	async message(@ConnectedSocket() client: Socket, @MessageBody() content: string) {
		const request: any = client.request;
		const user = await this.userRepo.findOneBy({ id: request.session.user_id });
	
		if (!user) {
			throw new HttpException('user not found', HttpStatus.NOT_FOUND);
		}

		this.server.in(client.room).emit("message", {
			user: {
				id: user.id,
				avatar: user.avatar,
			},
			content,
		});

		const room = await this.roomRepo.findOneBy({ id: Number(client.room) });
		const message = new Message;
	
		message.user = Promise.resolve(user);
		message.room = Promise.resolve(room);
		message.content = content;
		// TODO check if number, private room

		await this.messageRepo.save(message);
	}
}
