import { ArgumentMetadata, BadRequestException, ClassSerializerInterceptor, Controller, Delete, Get, HttpException, HttpStatus, Inject, Injectable, NotFoundException, Param, ParseIntPipe, PipeTransform, Post, Query, Request, UnprocessableEntityException, UseGuards, UseInterceptors } from "@nestjs/common";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Access } from "src/Access";
import { AuthGuard } from "src/auth/auth.guard";
import { ChatRoom } from "src/entities/ChatRoom";
import { User } from "src/entities/User";
import { GetUser } from "src/util";
import { Repository } from "typeorm";
import isNumeric from "validator/lib/isNumeric";
import * as argon2 from 'argon2';

const NO_SUCH_ROOM = "room not found";
const NOT_A_MEMBER = "not a member";
const NOT_OWNER = "not the owner";

class CreateRoomDTO {
	@MinLength(3)
	@MaxLength(20)
	@IsString()
	name: string;

	@IsEnum(Access)
	access: string;

	@MinLength(3)
	@MaxLength(20)
	@IsString()
	@IsOptional()
	password: string;
}

@Injectable()
export class RoomValidationPipe implements PipeTransform {
	constructor(@Inject('CHATROOM_REPO') private readonly chatRepo: Repository<ChatRoom>) {}

	async transform(value: any, metadata: ArgumentMetadata) {
		if (!value || value == null || !isNumeric(value)) {
			throw new BadRequestException("Invalid room id");
		}
		
		const room = await this.chatRepo.findOneBy({ id: Number(value) });
		
		if (!room) {
			throw new NotFoundException(NO_SUCH_ROOM);
		}
	
		return room;
	}
}

@Controller("/room")
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class RoomController {
	constructor(@Inject('CHATROOM_REPO') private readonly chatRepo: Repository<ChatRoom>) {}

	@Get("all")
	async rooms() {
		return await this.chatRepo.find();
	}

	@Get()
	async userRooms(@GetUser() user: User) {
		const rooms = await user.all_chat_rooms;
	
		return await Promise.all(rooms.map((room) => room.serialize()));
	}

	@Get(":id")
	async room(@GetUser() user: User, @Param("id", RoomValidationPipe) room: ChatRoom) {
		const user_rooms = await user.all_chat_rooms;
		const index = user_rooms.findIndex((it) => it.id === room.id);
	
		if (index < 0) {
			if (room.access === Access.PRIVATE)
				throw new HttpException(NO_SUCH_ROOM, HttpStatus.NOT_FOUND);
			else
				throw new HttpException(NOT_A_MEMBER, HttpStatus.UNAUTHORIZED);
		}

		return room.serialize();
	}

	@Post()
	async create(
		@GetUser() user: User,
		@Query("name") name: string,
		@Query("access") access: string,
		@Query("pasword") password?: string
	) {
		const room = new ChatRoom;

		if (!name) {
			throw new BadRequestException("missing room name");
		}
	
		const same_name = await this.chatRepo.findOneBy({ name });

		if (same_name) {
			throw new UnprocessableEntityException("a room with this name already exists");
		}
	
		room.name = name;
	
		room.owner = Promise.resolve(user);
		room.admins = Promise.resolve([user]);
		room.members = Promise.resolve([user]);

		if (!access) {
			throw new BadRequestException("missing access specifier: public, private or protected");
		}

		room.access = Access[access];

		if (room.access != Access.PROTECTED && password) {
			throw new BadRequestException("password provided even though access is not protected");
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
	async delete(@GetUser() user: User, @Param("id", RoomValidationPipe) room: ChatRoom) {
		const owner = await room.owner;
	
		if (owner.id !== user.id) {
			throw new HttpException(NOT_OWNER, HttpStatus.UNAUTHORIZED);
		}

		await this.chatRepo.remove(room);
	}


	async getRoom(id: number) {
		const room = await this.chatRepo.findOneBy({ id });

		if (!room) {
			throw new HttpException(NO_SUCH_ROOM, HttpStatus.NOT_FOUND);
		}

		return room;		
	}
}
