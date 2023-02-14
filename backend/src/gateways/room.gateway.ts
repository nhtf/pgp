import { Inject } from "@nestjs/common";
import {
	MessageBody,
	SubscribeMessage,
	ConnectedSocket,
	WebSocketServer,
	WsException,
} from "@nestjs/websockets";
import type { Socket, Server } from "socket.io";
import { ChatRoom } from "src/entities/ChatRoom";
import { Message } from "src/entities/Message";
import { User } from "src/entities/User";
import { Member } from "src/entities/Member";
import { Repository } from "typeorm";
import { ProtectedGateway } from "src/gateways/protected.gateway";
import { validate_id } from "src/util";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom } from "rxjs";
import { TENOR_KEY } from "src/vars";

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
		private readonly httpService: HttpService,
	) {
		super(userRepo);
	}

	@SubscribeMessage("join")
	join(@ConnectedSocket() client: Socket, @MessageBody() id: string) {
		try {
			validate_id(id);
		} catch (error) {
			throw new WsException(error.message);
		}
		client.room = id;

		client.join(id);
	}

	@SubscribeMessage("message")
	async message(@ConnectedSocket() client: Socket, @MessageBody() content: string) {
		const request: any = client.request;

		if (!client.room) {
			throw new WsException("Missing room id, did you join?");
		}
	
		const member = await this.memberRepo.findOne({
			relations: {
				user: true,
			},
			where: {
				user: {
					id: request.session.user_id,
				},
				room: {
					id: Number(client.room),
				}
			},
		});

		if (!member) {
			throw new WsException("not found");
		}
		
		if (member.mute > new Date) {
			throw new WsException("muted");
		}
		if (/^\/tenor /.test(content)) {
			const res = this.httpService.get(`https://tenor.googleapis.com/v2/search?q=${content.slice(content.indexOf(' ') + 1)}&key=${TENOR_KEY}`)
				.pipe(catchError((error) => {
					console.error("crap");
					throw "crap";
			}));

			const { data } = await firstValueFrom(res);
			content = data.results[0].url;
		}
		
		let message = new Message;
		
		message.content = content;
		message.member = member;
		message.room = { id: Number(client.room)} as ChatRoom;
		
		message = await this.messageRepo.save(message);
	
		this.server.in(client.room).emit("message", message);
	}
}
