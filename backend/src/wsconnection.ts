import { Inject, HttpStatus, HttpException } from '@nestjs/common';
import {
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { ChatRoom } from './entities/ChatRoom';
import { Message } from './entities/Message';
import { User } from './entities/User';
import { GetUser } from './util';
import * as session from 'express-session';
import express from 'express';
import { sessionMiddleware } from './app.module';

@WebSocketGateway({
	cors: { origin: 'http://localhost:5173', credentials: true },
})
export class WSConnection {
	@WebSocketServer()
	server: Server;

	users: string[];

	constructor(
		@Inject('CHATROOM_REPO')
		private readonly chatroomRepo: Repository<ChatRoom>,
		@Inject('USER_REPO')
		private readonly userRepo: Repository<User>,
		@Inject('MESSAGE_REPO')
		private readonly messageRepo: Repository<Message>
		) {
		this.users = [];
	}

	@SubscribeMessage('broadcast')
	async broadcast(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		client.broadcast.emit('broadcast', data);
	}

	@SubscribeMessage('joinGame')
	joinGame(@MessageBody() data: string): boolean {
		if (this.users.find((id) => id === data) === undefined) {
			this.users.push(data);
			return true;
		}
		return true;
	}

	@SubscribeMessage('joinRoom')
	joinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { room_id: string }) {
		client.join(data.room_id);
	}

	@SubscribeMessage('message')
	async message(@ConnectedSocket() client: Socket, @MessageBody() data: { room_id: string, content: string }) {
		const tmp: any = client;
		console.log(tmp.request.session);

            /*
		const user = await this.userRepo.findOneBy({ user_id: client.request.session.user_id });
		if (!user) throw new HttpException('user not found', HttpStatus.NOT_FOUND);

		this.server.in(data.room_id).emit("message", { user: user, content: data.content });
		const message: Message = new Message;
	
		message.user = Promise.resolve(user);
		message.room = Promise.resolve(await this.chatroomRepo.findOneBy({ id: Number(data.room_id) }));
		message.content = data.content;
		// TODO check if number, private room

		await this.messageRepo.save(message)
               */
	}
}
