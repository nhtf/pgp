import { Body, Get, HttpException, HttpStatus, Inject, Post, Request } from "@nestjs/common";
import { Repository } from "typeorm";
import { IRoomService, GenericRoomController, RequiredRole, GetRoom, GetMember } from "src/services/room.service";
import { ChatRoom } from "src/entities/ChatRoom";
import { Member } from "src/entities/Member";
import { Message } from "src/entities/Message";
import { RoomInvite } from "src/entities/RoomInvite";
import { Role } from "src/enums/Role";
import { UpdateGateway } from "src/gateways/update.gateway";
import { ParseIDPipe } from "src/util";

export class ChatRoomController extends GenericRoomController(ChatRoom, "room(s)?") {

	constructor(
		@Inject("CHATROOM_REPO")
		room_repo: Repository<ChatRoom>,
		@Inject("MEMBER_REPO")
		member_repo: Repository<Member>,
		@Inject("ROOMINVITE_REPO")
		invite_repo: Repository<RoomInvite>,
		@Inject("CHATROOM_PGPSERVICE")
		service: IRoomService<ChatRoom>,
		update_service: UpdateGateway,
		@Inject("MESSAGE_REPO")
		private readonly message_repo: Repository<Message>,
	) {
		super(room_repo, member_repo, invite_repo, service, update_service);
	}

	@Get("id/:id/messages")
	@RequiredRole(Role.MEMBER)
	async get_messages(@GetRoom() room: ChatRoom) {
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

	@Post("id/:id/promote")
	@RequiredRole(Role.OWNER)
	async promote(
		@GetRoom() room: ChatRoom,
		@GetMember() member: Member,
		@Body("target", ParseIDPipe(Member)) target: Member)
	{
		console.log("self:", member);
		console.log("target:", target);

		target.role += 1;

		console.log(target.role);


		if (target.role === Role.OWNER) {
			return {};
			member.role -= 1;
			await this.member_repo.save(member);
		}

		await this.member_repo.save(target);
	
		return {};
	}

	@Post("id/:id/demote")
	@RequiredRole(Role.OWNER)
	async demote(
		@Request() req: any,
		@GetRoom() room: ChatRoom,
		@GetMember() member: Member,
		@Body("target", ParseIDPipe(Member)) target: Member)
	{
		console.log(req);
		console.log("target:", target);

		if (target.role === 0) {
			throw new HttpException("Cannot demote members", HttpStatus.BAD_REQUEST);
		}
	
		target.role -= 1;
	
		await this.member_repo.save(target);
	
		return {};
	}

}
