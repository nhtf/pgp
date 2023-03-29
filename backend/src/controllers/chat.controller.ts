import { BadRequestException, Body, ForbiddenException, Get, Inject, Param, ParseIntPipe, Post, Delete, HttpCode, HttpStatus } from "@nestjs/common";
import { Repository } from "typeorm";
import { IRoomService, GenericRoomController, GetRoom, GetMember } from "src/services/room.service";
import { ChatRoom } from "src/entities/ChatRoom";
import { ChatRoomMember } from "src/entities/ChatRoomMember";
import { Message } from "src/entities/Message";
import { RoomInvite } from "src/entities/RoomInvite";
import { UpdateGateway } from "src/gateways/update.gateway";
import { ParseIDPipe } from "src/util";
import { ERR_PERM } from "src/errors";
import { Action, Role, Subject } from "src/enums";
import { RequiredRole } from "src/guards/role.guard"
import { Embed } from "src/entities/Embed";
import * as linkify from "linkifyjs";
import { EMBED_LIMIT, BOUNCER_KEY, EMBED_MAXLENGTH } from "src/vars";
import { CHAT_ACHIEVEMENT } from "src/achievements";
import { AchievementService } from "src/services/achievement.service";
import { createHmac } from "node:crypto";
import { IsString, MaxLength } from "class-validator";
import axios from "axios";

type Link = {
    type: string;
    value: string;
    isLink: boolean;
    href: string;
    start: number;
    end: number;
}

class MessageDTO {
	@IsString()
	@MaxLength(2000)
	content: string;
}

export class ChatController extends GenericRoomController(ChatRoom, ChatRoomMember, "chat") {

	constructor(
		@Inject("CHATROOM_REPO")
		room_repo: Repository<ChatRoom>,
		@Inject("MEMBER_REPO")
		member_repo: Repository<ChatRoomMember>,
		@Inject("ROOMINVITE_REPO")
		invite_repo: Repository<RoomInvite>,
		@Inject("CHATROOM_PGPSERVICE")
		service: IRoomService<ChatRoom, ChatRoomMember>,
		update_service: UpdateGateway,
		@Inject("MESSAGE_REPO")
		private readonly message_repo: Repository<Message>,
		private readonly achievementService: AchievementService,
	) {
		super(room_repo, member_repo, invite_repo, service, update_service);
	}

	async onJoin(room: ChatRoom, member: ChatRoomMember) {
		console.log(member);
		const messages = await this.message_repo.find({
			where: {
				room: {
					id: room.id,
				},
				member: null,
				user: {
					id: member.user.id,
				},
			}
		});

		messages.forEach((message) => {
			message.member = member;
		});

		await this.message_repo.save(messages);
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

			return embed;
		} catch (err){
			return null;
		}
	}

	@Get("id/:id/users")
	@RequiredRole(Role.MEMBER)
	async get_users(@GetRoom() room: ChatRoom) {
		const members: ChatRoomMember[] = await this.member_repo.find({
			relations: {
				user: true,
			},
			where: {
				room: {
					id: room.id,
				}
			}
		});
		const messages = await this.message_repo.find({
			relations: {
				user: true,
			},
			where: {
				member: null,
				room: {
					id: room.id,
				},
			},
		});

		const users = [...members.map((member) => member.user), ...messages.map((message) => message.user)];
		const unique = new Map(users.map((user) => [user.id, user]));

		return [...unique.values()];
	}

	@Post("id/:id/mute/:target")
	@RequiredRole(Role.ADMIN)
	async mute(
		@GetMember() member: ChatRoomMember,
		@GetRoom() room: ChatRoom,
		@Param("target", ParseIDPipe(ChatRoomMember, { room: { members: { user: true } } })) target: ChatRoomMember,
		@Body("duration", ParseIntPipe) duration: number
	) {
		if (target.room.id !== room.id) {
			throw new BadRequestException("Target not a member of this room");
		}
		
		if (target.role >= member.role) {
			throw new ForbiddenException(ERR_PERM);
		}

		target.mute = new Date(Date.now() + duration);
		
		await this.member_repo.save(target);
	
		UpdateGateway.instance.send_update({
			subject: Subject.MEMBER,
			action: Action.UPDATE,
			id: target.id,
			value: { is_muted: target.is_muted },
		}, ...target.room.users);
	
		if (target.mute > new Date) {
			setTimeout(() => {
				UpdateGateway.instance.send_update({
					subject: Subject.MEMBER,
					action: Action.UPDATE,
					id: target.id,
					value: { is_muted: false },
				}, ...target.room.users);
			}, duration);
		}
	}

	@Get("id/:id/messages")
	@RequiredRole(Role.MEMBER)
	async get_messages(@GetRoom() room: ChatRoom) {
		return await this.message_repo.find({
			relations: {
				member: true,
				user: true,
			},
			where: {
				room: {
					id: room.id,
				},
			},
		});
	}

	@Post("id/:id/message(s)?/")
	@RequiredRole(Role.MEMBER)
	@HttpCode(HttpStatus.NO_CONTENT)
	async sendMessage(
		@GetMember() member: ChatRoomMember,
		@GetRoom() room: ChatRoom,
		@Body() dto: MessageDTO,
	) {
		if (member.is_muted) {
			throw new ForbiddenException("You have been muted");
		}

		const content = dto.content;

		const links: Link[] = linkify.find(content, "url");
		const embeds = (await Promise.all(links.map((link) => this.createEmbed(link))))
			.filter((embed) => embed !== null)
			.slice(0, EMBED_LIMIT);
		
		const message = new Message();
	
		message.user = member.user;
		message.content = content;
		message.embeds = embeds;
		message.member = member;
		message.room = room;

		await this.message_repo.save(message);
		await this.achievementService.inc_progress(CHAT_ACHIEVEMENT, member.user, 1);
	}

	@Delete("id/:id/message(s)?/:message")
	@RequiredRole(Role.MEMBER)
	async deleteMessage(
		@GetMember() member: ChatRoomMember,
		@Param("message", ParseIDPipe(Message)) message: Message
	) {
		const target = await this.member_repo.findOneBy({ id: message.memberId });

		if (target.id !== member.id && target.role >= member.role) {
			throw new ForbiddenException(ERR_PERM);
		}

		await this.message_repo.remove(message);
	}

}
