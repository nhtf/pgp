import { GetRoom } from "src/controllers/room.controller";
import { IsString, Length, IsEmpty} from "class-validator";
import { ChatRoom } from "src/entities/ChatRoom";
import { Get, ForbiddenException, Body, Post, Inject, Delete, Controller, NotFoundException } from "@nestjs/common";
import { RoomInviteService } from "src/services/roominvite.service";
import { Me } from "src/util";
import { User } from "src/entities/User";
import { Role } from "src/enums";
import { CreateRoomDTO, NewChatRoomController } from "src/controllers/chat.controller";
import { ChatRoomService } from "src/services/chatroom.service";
import { UserService } from "src/services/user.service";
import { instanceToPlain } from "class-transformer"
import { AchievementService } from "src/services/achievement.service";
import { RequiredRole } from "src/guards/role.guard";

class CreateDMRoomDTO implements CreateRoomDTO {
	@IsEmpty()
	name?: string;

	@IsEmpty()
	is_private?: boolean;

	@IsEmpty()
	password?: string;

	@IsString()
	@Length(3, 20)
	username: string;
}

@Controller("dm")
export class DMRoomController extends NewChatRoomController {

	constructor(
		@Inject("CHATROOM_SERVICE")
		chat_service: ChatRoomService,
		invite_service: RoomInviteService,
		ach_service: AchievementService,
		private readonly user_service: UserService,
	) {
		super(chat_service, invite_service, ach_service);
	}

	@Get()
	async list_rooms(@Me() me: User) {
		const rooms = await this.room_service.get({ is_dm: true, members: { user: { id: me.id } } });

		return rooms.map((room) => {
			return {
				...instanceToPlain(room),
				joined: true,
				other: instanceToPlain(room.users.find(({ id }) => id !== me.id)),
			}
		});
	}

	@Post()
	async create_room(
		@Me() user: User,
		@Body() dto: CreateDMRoomDTO,
	) {
		const other = await this.user_service.get_by_username(dto.username);

		if (!other) {
			throw new NotFoundException("User not found")
		}

		if (other.id === user.id) {
			throw new ForbiddenException("Cannot create dm with oneself");
		}

		const name = `${Math.min(user.id, other.id)} & ${Math.max(user.id, other.id)}`;

		const tmp = await this.chat_service.get({name});

		if (!tmp || tmp.length !== 0) {
			throw new ForbiddenException("Room already exists");
		}

		const room = await this.chat_service.create({
			name,
			is_private: true,
			is_dm: true,
		});

		await this.room_service.add_members(room, { user, role: Role.MEMBER }, { user: other, role: Role.MEMBER });

		this.update(room, { other: instanceToPlain(other) });
	
		return room;
	}

	@Get(":id")
	@RequiredRole(Role.MEMBER)
	async get_room(@Me() me: User, @GetRoom() room: ChatRoom): Promise<any> {
		return { ...instanceToPlain(room), joined: true, other: room.users.find(({ id }) => id !== me.id) };
	}

	@Delete(":id/member(s)?/:member")
	async remove_member() {
		throw new ForbiddenException();
	}
}
