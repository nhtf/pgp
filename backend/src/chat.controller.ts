import { Controller, UseGuards, Get, Inject, Session, Post, Delete, Query, HttpException, HttpStatus, HttpCode } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthGuard } from './auth/auth.guard';
import { User } from './entities/User';
import { ChatRoom } from './Chat';
import { SessionObject } from './SessionUtils';
import { SetupGuard } from './account.controller';
import { GetUser } from './util';
import { IsNumber, isNumberString } from 'class-validator';
import { query } from 'express';
import { RmOptions } from 'fs';

class RoomDto {
	@IsNumber()
	id:	number;
}

@Controller('chat')
@UseGuards(AuthGuard, SetupGuard)
export class ChatRoomController {
	constructor(
		@Inject('CHATROOM_REPO') private readonly chatRepo: Repository<ChatRoom>,
		@Inject('USER_REPO') private readonly userRepo: Repository<User>) {}

	@Get()
	async getAllRooms() {
		const rooms = await this.chatRepo.find();
	
		return rooms;
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
		const room = await this.chatRepo.findOneBy({id: dto.id});
		if (!room)
			throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
		const members = await room.members;

		members.forEach((member, index) => {
			if (member == user)
				members.splice(index, 1);
		});
	}

	@Post("join")
	async join(@GetUser() user: User,  @Query() dto: RoomDto) {
		const room = await this.chatRepo.findOneBy({id: dto.id});
		if (!room)
			throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
		const members = await room.members;
	
		members.push(user);
	}

	@Delete()
	async delete(@Query() dto: RoomDto) {
		const room = await this.chatRepo.findOneBy({id: dto.id});
		if (!room)
			throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
		this.chatRepo.remove(room);
	}
}
