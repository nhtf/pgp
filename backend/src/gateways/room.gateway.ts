import { HttpException, HttpStatus, Inject, UseGuards } from "@nestjs/common";
import {
	MessageBody,
	SubscribeMessage,
	ConnectedSocket,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import type { Socket, Server } from "socket.io";
import { ChatRoom } from "src/entities/ChatRoom";
import { Message } from "src/entities/Message";
import type { User } from "src/entities/User";
import { Repository } from "typeorm";
import { FRONTEND_ADDRESS } from "src/vars";
import { ProtectedGateway } from "src/gateways/protected.gateway";

export class RoomGateway extends ProtectedGateway("room") {
	@WebSocketServer()
	server: Server;

	constructor(
		@Inject("USER_REPO")
		private readonly userRepo: Repository<User>,
		@Inject("MESSAGE_REPO")
		private readonly messageRepo: Repository<Message>
	) {
		super(userRepo);
	}

	@SubscribeMessage("join")
	join(@ConnectedSocket() client: Socket, @MessageBody() id: string) {
		client.room = id;
		
		client.join(id);
	}

	@SubscribeMessage("message")
	async message(@ConnectedSocket() client: Socket, @MessageBody() content: string) {
		const request: any = client.request;
		const user = await this.userRepo.findOneBy({ id: request.session.user_id });
	
		if (!user) {
			throw new HttpException("user not found", HttpStatus.NOT_FOUND);
		}

		this.server.in(client.room).emit("message", {
			content,
			user: {
				id: user.id,
				avatar: user.avatar,
			},
		});

		const members = await user.members;
		const rooms = await Promise.all(members.map((member) => member.room));
		const index = rooms.findIndex((room) => room.id === Number(client.room));
		const member = members[index];

		console.log(member);

		const message = new Message;
	
		message.content = content;
		message.member = member;
		message.room = { id: Number(client.room)} as ChatRoom;

		await this.messageRepo.save(message);
	}
}
