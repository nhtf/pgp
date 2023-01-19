import { ArgumentMetadata, BadRequestException, Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpException, HttpStatus, Inject, Injectable, NotFoundException, Param, ParseIntPipe, PipeTransform, Post, Query, Request, UnprocessableEntityException, UseGuards, UseInterceptors } from "@nestjs/common";
import { Access } from "src/Enums/Access";
import { AuthGuard } from "src/auth/auth.guard";
import { ChatRoom } from "src/entities/ChatRoom";
import { User } from "src/entities/User";
import { InjectUser, Me, ParseUsernamePipe } from "src/util";
import { Repository } from "typeorm";
import isNumeric from "validator/lib/isNumeric";
import * as argon2 from 'argon2';
import { RoomInvite } from "src/entities/RoomInvite";

const NO_SUCH_ROOM = "room not found";
const NOT_A_MEMBER = "not a member";
const NOT_OWNER = "not the owner";

@Injectable()
export class RoomValidationPipe implements PipeTransform {
	constructor(@Inject('CHATROOM_REPO') private readonly chatRepo: Repository<ChatRoom>) {}

	async transform(value: any, metadata: ArgumentMetadata) {
		if (!value || value == null || !isNumeric(value)) {
			throw new BadRequestException("Invalid room id");
		}
		
		const room = await this.chatRepo.findOneBy({ id: Number(value) });
		
		if (!room) {
			throw new HttpException(NO_SUCH_ROOM, HttpStatus.NOT_FOUND);
		}
	
		return room;
	}
}

@Controller("/room(s)?")
@UseGuards(AuthGuard, InjectUser)
@UseInterceptors(ClassSerializerInterceptor)
export class RoomController {
	constructor(@Inject('CHATROOM_REPO') private readonly chatRepo: Repository<ChatRoom>) {}

	@Get("all")
	async rooms() {
		return await this.chatRepo.find();
	}

	@Get()
	async userRooms(@Me() user: User) {
		const rooms = await user.all_chat_rooms;
	
		return await Promise.all(rooms.map((room) => room.serialize()));
	}

	@Get(":id")
	async room(@Me() user: User, @Param("id", RoomValidationPipe) room: ChatRoom) {
		const rooms = await user.all_chat_rooms;
		const index = rooms.findIndex((it) => it.id === room.id);
	
		if (index < 0) {
			if (room.access === Access.PRIVATE)
				throw new HttpException(NO_SUCH_ROOM, HttpStatus.NOT_FOUND);
			else
				throw new HttpException(NOT_A_MEMBER, HttpStatus.UNAUTHORIZED);
		}

		return await room.serialize();
	}

	@Post()
	async create(
		@Me() user: User,
		@Body("name") name: string,
		@Body("access") access: string,
		@Body("pasword") password?: string
	) {
		if (!name) {
			throw new BadRequestException("missing room name");
		}
	
		const same_name = await this.chatRepo.findOneBy({ name });

		if (same_name) {
			throw new UnprocessableEntityException("a room with this name already exists");
		}
	
		const room = new ChatRoom;

		room.name = name;
		room.owner = Promise.resolve(user);
		room.admins = Promise.resolve([user]);
		room.members = Promise.resolve([user]);

		if (!access) {
			throw new BadRequestException("missing access specifier: public or private");
		}

		room.access = Access[access];

		if (room.password && room.password.length > 0) {
			room.access = Access.PROTECTED;
		}

		if (room.access == Access.PROTECTED) {
			if (!room.password || room.password.length == 0) {
				throw new BadRequestException("missing password");
			}
		
			room.password = await argon2.hash(password);
		}

		return await this.chatRepo.save(room);
	}

	@Delete(":id")
	async delete(@Me() user: User, @Param("id", RoomValidationPipe) room: ChatRoom) {
		const owner = await room.owner;
	
		if (owner.id != user.id) {
			throw new HttpException(NOT_OWNER, HttpStatus.UNAUTHORIZED);
		}

		return await this.chatRepo.remove(room);
	}

	@Post(":id/invite")
	async invite(@Me() user: User, @Param("id", RoomValidationPipe) room: ChatRoom, @Body("username", ParseUsernamePipe) invitee: User) {
		if (!this.canInvite(user, room)) {
			throw new HttpException(NOT_A_MEMBER, HttpStatus.FORBIDDEN);
		}

		if (user.id === invitee.id) {
			throw new HttpException("Can't invite yourself", HttpStatus.CONFLICT);
		}

		const invite = new RoomInvite;

		invite.from = Promise.resolve(user);
		invite.to = Promise.resolve(invitee);
		invite.room = Promise.resolve(room);
	
		const invites = [...await room.invites, invite];
		
		room.invites = Promise.resolve(invites);

		console.log(room.id);
		console.log(room);

		return await this.chatRepo.save({ id: room.id, room });
	}

	async canInvite(user: User, room: ChatRoom) {
		const admins = await room.admins;
		const index = admins.findIndex((admin) => admin.id === user.id);

		return index >= 0;
	}
}
