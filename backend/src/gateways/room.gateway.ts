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
import { TENOR_KEY, BOUNCER_KEY } from "src/vars";
import * as linkify from "linkifyjs";
import axios from "axios";
import { instanceToPlain } from "class-transformer"
import { ClientRequest } from "node:http";
import { createHmac } from "node:crypto";
import { Embed } from "src/entities/Embed";

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
			throw new WsException("Missing room id");
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

		const links = linkify.find(content, "url");
		const embeds = [];
		// console.log(links);

		for (const link of links) {
			if (embeds.length > 3)
				break;
			try {
				//TODO set maxContentLength to something sane
				const res = await axios.head(link.href, { maxContentLength: 1000000000 });
				//TODO find out how revolt detects embed type

				const client = res.request as ClientRequest;
				const address = client.socket.remoteAddress;
				//TODO check if address is not a local address
				//console.log(client.socket.localAddress);
				const type = res.headers["content-type"];

				if (typeof type !== "string")
					continue;

				const embed = new Embed();
				embed.digest = createHmac("sha256", BOUNCER_KEY).update(link.href).digest("hex");
				embed.url = link.href;
				
				if (type.startsWith("text/html")) {
					embed.rich = true;
				} else if (type.startsWith("image/") || type.startsWith("video/")) {
					embed.rich = false;
				} else {
					continue;
				}
				
				embeds.push(embed);
			} catch {}
		}
		
		let message = new Message;
		
		message.content = content;
		message.member = member;
		message.room = { id: Number(client.room)} as ChatRoom;
		message.user = member.user;
		//TODO send the link raw with digest?
		message.embeds = embeds;
		
		message = await this.messageRepo.save(message);
	
		this.server.in(client.room).emit("message", instanceToPlain(message));
	}
}
