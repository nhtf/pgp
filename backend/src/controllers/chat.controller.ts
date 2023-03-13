import { BadRequestException, Body, ForbiddenException, Get, Inject, Param, ParseIntPipe, Post, Delete } from "@nestjs/common";
import { Repository } from "typeorm";
import { IRoomService, GenericRoomController, GetRoom, GetMember } from "src/services/room.service";
import { ChatRoom } from "src/entities/ChatRoom";
import { ChatRoomMember } from "src/entities/ChatRoomMember";
import { Message } from "src/entities/Message";
import { RoomInvite } from "src/entities/RoomInvite";
import { User } from "src/entities/User";
import { UpdateGateway } from "src/gateways/update.gateway";
import { ParseIDPipe } from "src/util";
import { ERR_PERM } from "src/errors";
import { Action, Role, Subject } from "src/enums";
import { RequiredRole } from "src/guards/role.guard"

export class ChatRoomController extends GenericRoomController(ChatRoom, ChatRoomMember, "chat") {

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
	) {
		super(room_repo, member_repo, invite_repo, service, update_service);
	}

	async afterJoin(room: ChatRoom, member: ChatRoomMember) {
		const messages = await this.message_repo.find({
			where: {
				room: {
					id: room.id,
				},
				member: null,
				user: {
					id: member.userId,
				},
			}
		});

		messages.forEach((message) => {
			message.member = member;
		});

		await this.message_repo.save(messages);
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
		const unique = new Map<number, User>(users.map((user) => [user.id, user]));

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
	
		if (target.mute > new Date) {
			setTimeout(() => {
				UpdateGateway.instance.send_update({
					subject: Subject.MEMBER,
					action: Action.SET,
					id: target.id,
					value: { is_muted: false },
				}, ...target.room.users);
			});
		}

		return {};
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

		return await this.message_repo.remove(message);
	}

}
