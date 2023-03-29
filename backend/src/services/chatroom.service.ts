import { Injectable, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { GenericRoomService, CreateRoomOptions } from "src/services/new.room.service";
import { ChatRoom } from "src/entities/ChatRoom";
import { ChatRoomMember } from "src/entities/ChatRoomMember";

@Injectable()
export class ChatRoomService extends GenericRoomService<ChatRoom, ChatRoomMember, CreateRoomOptions>(ChatRoom, ChatRoomMember) {
	constructor(
		@Inject("CHATROOM_REPO")
		room_repo: Repository<ChatRoom>,
		@Inject("CHATROOMMEMBER_REPO")
		member_repo: Repository<ChatRoomMember>,
	) {
		super(room_repo, member_repo);
	}

	async mute_members(...infos: { member: ChatRoomMember, until: Date }[]) {
		const members = [];
		for (const { member, until } of infos) {
			member.mute = until;
			members.push(member);
		}
		await this.member_repo.save(members);
	}
}
