import { Get, Inject, UseGuards } from "@nestjs/common";
import { Repository } from "typeorm";
import { IRoomService, GenericRoomController, RoleGuard, GetRoom } from "src/services/room.service";
import { ChatRoom } from "src/entities/ChatRoom";
import { Member } from "src/entities/Member";
import { Message } from "src/entities/Message";
import { RoomInvite } from "src/entities/RoomInvite";
import { Role } from "src/enums/Role";

export class ChatRoomController extends GenericRoomController(ChatRoom, "room(s)?") {

	constructor(
		@Inject("CHATROOM_REPO") room_repo: Repository<ChatRoom>,
		@Inject("MEMBER_REPO") member_repo: Repository<Member>,
		@Inject("ROOMINVITE_REPO") invite_repo: Repository<RoomInvite>,
		@Inject("CHATROOM_SERVICE") service: IRoomService<ChatRoom>,
		@Inject("MESSAGE_REPO") private readonly message_repo: Repository<Message>,
	) {
		super(room_repo, member_repo, invite_repo, service);
	}

	@Get(":id/messages")
	@UseGuards(RoleGuard(Role.MEMBER))
	async get_messages(
		@GetRoom() room: ChatRoom
	) {
		return this.message_repo.find({
			relations: {
				member: {
					user: true,
				},
			},
			where: {
				room: {
					id: room.id,
				},
			},
		});
	}
}
