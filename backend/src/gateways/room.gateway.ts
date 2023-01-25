import { HttpException, HttpStatus, Inject } from '@nestjs/common';
import {
	MessageBody,
	SubscribeMessage,
	ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatRoom } from 'src/entities/ChatRoom';
import { Message } from 'src/entities/Message';
import { User } from 'src/entities/User';
import { Repository } from 'typeorm';
import { ProtectedGateway } from './protected.gateway';

export class RoomGateway extends ProtectedGateway("room") {
	constructor(
		@Inject('USER_REPO')
		private readonly userRepo: Repository<User>,
		@Inject('MESSAGE_REPO')
		private readonly messageRepo: Repository<Message>
	) {
		super();
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
			content,
			user: {
				id: user.id,
				avatar: user.avatar,
			},
		});

		const message = new Message;
	
		message.user = Promise.resolve(user);
		message.room = Promise.resolve({ id: Number(client.room)} as ChatRoom);
		message.content = content;
		// TODO check if number, private room

		await this.messageRepo.save(message);
	}
}
