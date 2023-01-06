import { Controller, UseGuards, Inject, Post, Get, Delete, Query, Body, HttpException, HttpStatus, HttpCode, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthGuard } from './auth/auth.guard';
import { User } from './entities/User';
import { ChatRoom } from './entities/ChatRoom';
import { SetupGuard } from './account.controller';
import { GetUser } from './util';
import { IsNumberString, IsString, MinLength, MaxLength, IsOptional, IsBooleanString } from 'class-validator';
import * as argon2 from 'argon2';
import { classToPlain } from 'class-transformer';

class RoomDto {
	@IsNumberString()
	id: string;
}

class JoinRoomDTO {
	@IsNumberString()
	id: string;

	@MinLength(3)
	@MaxLength(20)
	@IsString()
	@IsOptional()
	password: string;
}

class CreateRoomDTO {
	@MinLength(3)
	@MaxLength(20)
	@IsString()
	name: string;

	@IsBooleanString()
	private: string;

	@MinLength(3)
	@MaxLength(20)
	@IsString()
	@IsOptional()
	password: string;
}

@Controller('chat')
@UseGuards(AuthGuard, SetupGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ChatRoomController {
	constructor(
		@Inject('CHATROOM_REPO') private readonly chatRepo: Repository<ChatRoom>
	) {}

	@Post("mine")
	async getUserRooms(@GetUser() user: User) {
		return await this.chatRepo.findBy({id: user.user_id });
	}

	@Get("rooms")
	async rooms() {
		const list = await this.chatRepo.find();
		return list;
	}

	@Post("create")
	@HttpCode(HttpStatus.CREATED)
	async createRoom(@GetUser() user: User, @Body() dto: CreateRoomDTO) {
		const is_private = (dto.private == 'true');

		console.log(is_private);
	
		if (is_private && dto.password)
			throw new HttpException('a room cannot be both private and password protected', HttpStatus.UNPROCESSABLE_ENTITY);
		if (await this.chatRepo.findOneBy({ name: dto.name }))
			throw new HttpException('a room with this name already exists', HttpStatus.UNPROCESSABLE_ENTITY);

		const room = new ChatRoom;

		room.owner = Promise.resolve(user);
		room.private = is_private;
		room.name = dto.name;
		try {
			room.password = dto.password ? await argon2.hash(dto.password) : undefined;
		} catch (err) {
			console.error(err);
			throw new HttpException('could not create room', HttpStatus.INTERNAL_SERVER_ERROR);
		}
		room.members = Promise.resolve([user]);

		return await this.chatRepo.save(room);
	}

	@Post("leave")
	async leave(@GetUser() user: User, @Query() dto: RoomDto) {
		const room = await this.getRoom(dto);
		const members = await room.members;

		members.forEach((member, index) => {
			if (member == user)
				members.splice(index, 1);
		});
	}

	@Post("join")
	@HttpCode(HttpStatus.NO_CONTENT)
	async join(@GetUser() user: User,  @Body() dto: JoinRoomDTO) {
		const room = await this.chatRepo.findOneById(dto.id);
		if (!room)
			throw new HttpException('no room with such id', HttpStatus.NOT_FOUND);
		const members = await room.members;

		const idx = members.findIndex((current: User) => current.user_id === user.user_id);
		if (idx >= 0)
			throw new HttpException('already a member of this room', HttpStatus.FORBIDDEN);

		if (room.has_password) {
			if (!dto.password)
				throw new HttpException('password required', HttpStatus.UNAUTHORIZED);
			//TODO handle possible exception that argon2.verify can throw
			if (!await argon2.verify(room.password, dto.password))
				throw new HttpException('invalid password', HttpStatus.UNAUTHORIZED);
		}
		//TODO check if room is private room and the user has an invite
		
		if (members)
			members.push(user);
		else
			room.members = Promise.resolve([user]);
		this.chatRepo.save(room);
	}

	@Delete()
	async delete(@Query() dto: RoomDto) {
		const room = await this.getRoom(dto);

		await this.chatRepo.remove(room);
	}

	async getRoom(@Query() dto: RoomDto) {
		const room = await this.chatRepo.findOneBy({id: Number(dto.id) });
		if (!room)
			throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
		return room;
	}
}
