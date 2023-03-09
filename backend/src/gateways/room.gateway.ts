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
import { ChatRoomMember } from "src/entities/ChatRoomMember";
import { Repository } from "typeorm";
import { ProtectedGateway } from "src/gateways/protected.gateway";
import { HttpService } from "@nestjs/axios";
import { BOUNCER_KEY } from "src/vars";
import { ClientRequest } from "node:http";
import { createHmac } from "node:crypto";
import { Embed } from "src/entities/Embed";
import * as linkify from "linkifyjs";
import axios from "axios";

const embedLimit = 3;

export class RoomGateway extends ProtectedGateway("room") {
	@WebSocketServer()
	server: Server;

	constructor(
		@Inject("USER_REPO")
		private readonly userRepo: Repository<User>,
		@Inject("ROOM_REPO")
		private readonly roomRepo: Repository<ChatRoom>,
		@Inject("MESSAGE_REPO")
		private readonly messageRepo: Repository<Message>,
		@Inject("MEMBER_REPO")
		private readonly memberRepo: Repository<ChatRoomMember>,
		private readonly httpService: HttpService,
	) {
		super(userRepo);
	}

	@SubscribeMessage("message")
	async message(@ConnectedSocket() client: Socket, @MessageBody() content: string) {
		const room = await this.roomRepo.findOneBy({ id: client.room });
		const member = await this.memberRepo.findOneBy({
			room: {	id: room.id },
			user: {
				id: client.request.session.user_id,
			},
		});

		if (!member) {
			throw new WsException("not found");
		}
		
		if (member.mute > new Date) {
			throw new WsException("muted");
		}

		const links = linkify.find(content, "url");
		const embeds = [];
	
		for (const link of links) {
			if (embeds.length > embedLimit)
				break;
			try {
				//TODO set maxContentLength to something sane
				const res = await axios.head(link.href, { maxContentLength: 1000000000, maxRedirects: 5 });
				//TODO find out how revolt detects embed type

				const client = res.request as ClientRequest;
				const address = client.socket.remoteAddress;
				//TODO check if address is not a local address
				//console.log(client.socket.localAddress);
				const type = res.headers["content-type"];

				if (typeof type !== "string")
					continue;

				const embed = new Embed();
				embed.url = new URL(link.href).toString();
				embed.digest = createHmac("sha256", BOUNCER_KEY).update(embed.url).digest("hex");
				
				if (type.startsWith("text/html")) {
					embed.rich = true;
				} else if (type.startsWith("image/") || type.startsWith("video/")) {
					embed.rich = false;
				} else {
					continue;
				}
				
				embeds.push(embed);
			} catch (err){
				console.error("axios:", err);
			}
		}


		let message = new Message;
		
		message.content = content;
		message.member = member;
		message.room = room;
		message.user = member.user;
		//TODO send the link raw with digest?
		message.embeds = embeds;

		message = await this.messageRepo.save(message);
	
		// this.server.in(String(client.room)).emit("message", instanceToPlain(message));
	}
}
