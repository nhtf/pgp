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
import { RoomInvite } from "src/entities/RoomInvite";
import { Message } from "src/entities/Message";
import { User } from "src/entities/User";
import { ChatRoomMember } from "src/entities/ChatRoomMember";
import { Repository } from "typeorm";
import { ProtectedGateway } from "src/gateways/protected.gateway";
import { BOUNCER_KEY, EMBED_MAXLENGTH } from "src/vars";
import { createHmac } from "node:crypto";
import { Embed } from "src/entities/Embed";
import { Role } from "src/enums"
import { AchievementProgress } from "src/entities/AchievementProgress";
import type { Achievement } from "src/entities/Achievement";
import * as linkify from "linkifyjs";
import "linkify-plugin-mention";
import axios from "axios";
import { instanceToPlain } from "class-transformer";

const embedLimit = 3;

type Link = {
    type: string;
    value: string;
    isLink: boolean;
    href: string;
    start: number;
    end: number;
}

export class RoomGateway extends ProtectedGateway("room") {
	@WebSocketServer()
	server: Server;

	constructor(
		@Inject("USER_REPO")
		readonly userRepo: Repository<User>,
		@Inject("ROOM_REPO")
		private readonly roomRepo: Repository<ChatRoom>,
		@Inject("MESSAGE_REPO")
		private readonly messageRepo: Repository<Message>,
		@Inject("MEMBER_REPO")
		private readonly memberRepo: Repository<ChatRoomMember>,
		@Inject("ROOMINVITE_REPO")
		private readonly inviteRepo: Repository<RoomInvite>,
		@Inject("ACHIEVEMENTPROGRESS_REPO")
		private readonly progressRepo: Repository<AchievementProgress>,
		@Inject("ACHIEVEMENT_REPO")
		private readonly achievementRepo: Repository<Achievement>,
	) {
		super(userRepo);
	}

	@SubscribeMessage("message")
	async message(@ConnectedSocket() client: Socket, @MessageBody() content: string) {
		if (!client.room) {
			throw new WsException("Must have joined a room");
		}
	
		const room = await this.roomRepo.findOneBy({ id: client.room });
		const member = await this.memberRepo.findOneBy({
			room: {	id: room.id },
			user: {	id: client.user.id },
		});

		if (!member) {
			throw new WsException("not found");
		}
		
		if (typeof content !== "string") {
			throw new WsException("Content must be a string");
		}

		if (member.mute > new Date) {
			throw new WsException("muted");
		}

		const links: Link[] = linkify.find(content, "url");
		const embeds = await Promise.all(links
			.map((link) => this.createEmbed(link))
			.filter((embed) => embed !== null)
			.slice(0, embedLimit));
	
		
		let message = new Message;

		message.content = content;
		message.member = member;
		message.room = room;
		message.user = member.user;
		//ODOT send the link raw with digest?
		message.embeds = embeds;

		await this.messageRepo.save(message);

		if (member.role >= Role.ADMIN) {
			const user = await this.userRepo.findOneBy({ id: client.request.session.user_id });
		
			linkify.find(message.content, "mention").forEach((link: Link) => {
				this.invite(link.value.slice(1), room, user)
			});
		}

		let progress = await this.progressRepo.findOneBy({
			achievement: { name: "Chatty" },
			user: {	id: member.user.id },
		});
	
		if (!progress) {
			progress = new AchievementProgress();
			progress.progress = 0;
			progress.user = member.user;
			progress.achievement = await this.achievementRepo.findOneBy({ name: "Chatty" }); //TODO make chatty a constant variable
		}
		progress.progress += 1;

		await this.progressRepo.save(progress);

		this.server.in(String(client.room)).emit("message", instanceToPlain(message));
	}

	async createEmbed(link: Link): Promise<Embed | null> {
		try {
			const response = await axios.head(link.href, { maxContentLength: EMBED_MAXLENGTH, maxRedirects: 5 });
		
			// TODO check if address is not a local address
			// const client = response.request as ClientRequest;
			// const address = client.socket.remoteAddress;
			// console.log(client.socket.localAddress);
			const type: string = response.headers["content-type"];

			if (!type) {
				return null;
			}

			const embed = new Embed;
		
			embed.url = new URL(link.href).toString();
			embed.digest = createHmac("sha256", BOUNCER_KEY).update(embed.url).digest("hex");
			embed.rich = type.startsWith("text/html");
		
			// if (type.startsWith("text/html")) {
			// 	embed.rich = true;
			// } else if (type.startsWith("image/") || type.startsWith("video/")) {
			// 	embed.rich = false;
			// }
			
			return embed;
		} catch (err){
			return null;
		}
	}

	async invite(username: string, room: ChatRoom, me: User) {
		const user = await this.userRepo.findOneBy({ username });

		if (!user || room.users.map((user) => user.id).includes(user.id)) {
			return ;
		}

		await this.inviteRepo.save({ from: me, to: user, room });
	}
}
