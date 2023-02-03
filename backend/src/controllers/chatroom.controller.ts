import { Get, Inject, UseGuards } from "@nestjs/common";
import { Repository } from "typeorm";
import { IRoomService, GenericRoomController, RequiredRole, GetRoom } from "src/services/room.service";
import { ChatRoom } from "src/entities/ChatRoom";
import { Member } from "src/entities/Member";
import { Message } from "src/entities/Message";
import { RoomInvite } from "src/entities/RoomInvite";
import { Role } from "src/enums/Role";
import { InjectRepository } from "@nestjs/typeorm";

export class ChatRoomController extends GenericRoomController(ChatRoom, "room(s)?") {

	constructor(
		@InjectRepository(ChatRoom)
		room_repo: Repository<ChatRoom>,
		@InjectRepository(Member)
		member_repo: Repository<Member>,
		@InjectRepository(RoomInvite)
		invite_repo: Repository<RoomInvite>,
		@InjectRepository(ChatRoom)
		service: IRoomService<ChatRoom>,
		@InjectRepository(Message)
		private readonly message_repo: Repository<Message>,
	) {
		super(room_repo, member_repo, invite_repo, service);
	}

	@Get(":id/messages")
	@RequiredRole(Role.MEMBER)
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
