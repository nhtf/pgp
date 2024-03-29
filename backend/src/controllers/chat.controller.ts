import type { CreateRoomOptions } from "src/services/room.service";
import type { User } from "src/entities/User";
import type { Embed } from "src/entities/Embed";
import { Get, Inject, Delete, Param, ForbiddenException, Body, Post, HttpCode, HttpStatus } from "@nestjs/common";
import { IsString, Length, IsOptional, IsBoolean, IsDateString, IsEnum } from "class-validator";
import { GenericRoomController, GetRoom, GetMember } from "src/controllers/room.controller";
import { RoomInviteService } from "src/services/roominvite.service";
import { ChatRoomService } from "src/services/chatroom.service";
import { ChatRoomMember } from "src/entities/ChatRoomMember";
import { RequiredRole } from "src/guards/role.guard";
import { ChatRoom } from "src/entities/ChatRoom";
import { Message } from "src/entities/Message";
import { EMBED_LIMIT } from "src/vars";
import { ParseIDPipe, Me } from "src/util";
import { ERR_PERM } from "src/errors";
import { Role } from "src/enums";
import { AchievementService } from "src/services/achievement.service";
import { CHAT_ACHIEVEMENT  } from "src/achievements";
import type { Link } from "src/types";
import * as linkify from "linkifyjs";

export class CreateRoomDTO implements CreateRoomOptions {
	@IsString()
	@IsOptional()
	@Length(3, 20)
	name?: string;

	@IsBoolean()
	@IsOptional()
	is_private?: boolean;

	@IsString()
	@IsOptional()
	@Length(1, 500)
	password?: string;
}

class EditRoomDTO implements Partial<CreateRoomOptions> {
	@IsString()
	@Length(3, 20)
	@IsOptional()
	name?: string;

	@IsBoolean()
	@IsOptional()
	is_private?: boolean;

	@IsString()
	@IsOptional()
	@Length(1, 500)
	password?: string;
} 

class EditMemberDTO implements Partial<ChatRoomMember> {
	@IsOptional()
	@IsEnum(Role)
	role?: Role;

	@IsOptional()
	@IsDateString()
	mute?: Date;
}

class MessageDTO {
	@IsString()
	@Length(1, 2000)
	content: string;
}

export class NewChatRoomController extends GenericRoomController(
	ChatRoom,
	ChatRoomMember,
	CreateRoomDTO,
	EditRoomDTO,
	EditMemberDTO,
	"chat"
) {

	constructor(
		@Inject("CHATROOM_SERVICE")
		protected readonly chat_service: ChatRoomService,
		invite_service: RoomInviteService,
		protected readonly ach_service: AchievementService,
	) {
		super(chat_service, invite_service);
	}

	@Get(":id/message(s)?")
	@RequiredRole(Role.MEMBER)
	async list_messages(@GetRoom() room: ChatRoom) {
		return this.chat_service.get_messages(room);
	}

	@Post(":id/message(s)?")
	@RequiredRole(Role.MEMBER)
	@HttpCode(HttpStatus.NO_CONTENT)
	async send_message(
		@Me() user: User,
		@GetRoom() room: ChatRoom,
		@GetMember() member: ChatRoomMember,
		@Body() dto: MessageDTO,
	) {
		if (member.is_muted)
			throw new ForbiddenException("You are muted");

		const content = dto.content;
		
		const links: Link[] = linkify.find(content, "url");
		const embeds = (await Promise.all(
			links
				.slice(0, EMBED_LIMIT)
				.map((link) => this.chat_service.create_embed(new URL(link.href)))
		)).filter((embed) => embed !== null) as Embed[];

		const message = new Message();

		message.user = member.user;
		message.content = content;
		message.embeds = embeds;
		message.member = member;
		message.room = room;

		await this.ach_service.inc_progress(CHAT_ACHIEVEMENT, member.user, 1);

		await this.chat_service.add_messages(room, message);
	}

	@Delete(":id/message(s)?/:message")
	@RequiredRole(Role.MEMBER)
	@HttpCode(HttpStatus.NO_CONTENT)
	async delete_message(
		@GetRoom() room: ChatRoom,
		@GetMember() member: ChatRoomMember,
		@Param("message", ParseIDPipe(Message, { user: true })) message: Message
	) {
		const message_owner = await this.room_service.get_member(room, message.user);

		if (message_owner == undefined) {
			if (member.role < Role.ADMIN)
				throw new ForbiddenException(ERR_PERM);
		} else if (message_owner.id !== member.id && message_owner.role >= member.role) {
			throw new ForbiddenException(ERR_PERM);
		}
		await this.chat_service.remove_messages(message);
	}
}
