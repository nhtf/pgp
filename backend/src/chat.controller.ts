import { Controller, UseGuards, Inject, Post, Delete, Query, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthGuard } from './auth/auth.guard';
import { User } from './entities/User';
import { ChatRoom } from './entities/ChatRoom';
import { SetupGuard } from './account.controller';
import { GetUser } from './util';
import { IsNumberString, IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

class RoomDto {
	@IsNumberString()
	id: string;
}

class CreateRoomDTO {
	@MinLength(3)
	@MaxLength(20)
	@IsString()
	name: string;

	@IsBoolean()
	visible: boolean;

	@MinLength(3)
	@MaxLength(20)
	@IsString()
	@IsOptional()
	password: string;
}

@Controller('chat')
@UseGuards(AuthGuard, SetupGuard)
export class ChatRoomController {
	constructor(
		@Inject('CHATROOM_REPO') private readonly chatRepo: Repository<ChatRoom>
	) {}

	@Post("mine")
	async getUserRooms(@GetUser() user: User) {
		return await this.chatRepo.findBy({id: user.user_id });
	}

	@Post("create")
	async createRoom(@GetUser() user: User) {
		const room = new ChatRoom;

		room.owner = Promise.resolve(user);

		this.chatRepo.save(room);
		return "Created room";
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
	async join(@GetUser() user: User,  @Query() dto: RoomDto) {
		const room = await this.getRoom(dto);
		const members = await room.members;
	
		members.push(user);
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
