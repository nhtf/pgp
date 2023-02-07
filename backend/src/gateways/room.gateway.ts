import { HttpException, HttpStatus, Inject, UseGuards } from "@nestjs/common";
import {
	MessageBody,
	SubscribeMessage,
	ConnectedSocket,
	WebSocketGateway,
	WebSocketServer,
	WsException,
} from "@nestjs/websockets";
import type { Socket, Server } from "socket.io";
import { InjectRepository } from "@nestjs/typeorm";
import { ChatRoom } from "src/entities/ChatRoom";
import { Message } from "src/entities/Message";
import { User } from "src/entities/User";
import { Member } from "src/entities/Member";
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
		private readonly messageRepo: Repository<Message>,
		@Inject("MEMBER_REPO")
		private readonly memberRepo: Repository<Member>,
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
		const member = await this.memberRepo.findOne({
			relations: {
				user: true,
			},
			where: {
				user: {
					id: request.session.user_id,
				},
			},
		});

		console.log(member);

		if (!member) {
			throw new WsException("not found");
		}
		
		this.server.in(client.room).emit("message", {
			content,
			user: {
				id: member.user.id,
				avatar: member.user.avatar,
				username: member.user.username,
			},
		});

		const message = new Message;
	
		message.content = content;
		message.member = member;
		message.room = { id: Number(client.room)} as ChatRoom;

		await this.messageRepo.save(message);
	}
}
