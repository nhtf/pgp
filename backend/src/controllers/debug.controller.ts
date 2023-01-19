import {
	Controller,
	Inject,
	HttpException,
	HttpStatus,
	Req,
	Get,
	Query,
} from '@nestjs/common';
import {
	Length,
	IsString,
	IsOptional,
	IsInt,
	IsEnum,
} from 'class-validator';
import { User } from '../entities/User';
import { ChatRoom } from '../entities/ChatRoom';
import { AuthLevel } from '../auth/AuthLevel';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { SessionUtils } from '../SessionUtils';
import { GetUserQuery } from '../util';

class UserDto {
	@IsString()
	@Length(1, 20)
	@IsOptional()
	username: string;

	@IsInt()
	@IsOptional()
	oauth_id?: number;

	@IsString()
	@IsOptional()
	secret?: string;

	@IsString()
	@IsOptional()
	avatar_base?: string;

	@IsEnum(AuthLevel)
	@IsOptional()
	auth_req?: string;
}

// TODO THIS MUST BE DISABLED BEFORE TURNING IN!
@Controller('debug')
export class DebugController {
	constructor(
		@Inject('USER_REPO') private readonly userRepo: Repository<User>,
		private readonly sessionUtils: SessionUtils,
		@Inject('CHATROOM_REPO') private readonly chatRepo: Repository<ChatRoom>,
	) {}

	@Get('useradd')
	async useradd(@Query() dto: UserDto) {
		const exists = dto.username ?
			(await this.userRepo.findOneBy({ username: dto.username })) !== null : false;
		if (exists)
			throw new HttpException(
				'an user with that username already exists',
				HttpStatus.BAD_REQUEST,
			);

		const user = new User();
		user.username = dto.username;
		user.oauth_id = dto.oauth_id ?? -1;
		user.secret = dto.secret;
		user.avatar_base = dto.avatar_base ?? null;
		user.auth_req = dto.secret ? AuthLevel.TWOFA : AuthLevel.OAuth;
		user.online = true;
		await this.userRepo.save(user);
		return user;
	}

	@Get('usermod')
	async usermod(@Query() dto: UserDto) {
		const user = await this.userRepo.findOneBy({ username: dto.username });
		if (!user)
			throw new HttpException('user does not exist', HttpStatus.NOT_FOUND);
		user.oauth_id = dto.oauth_id ?? user.oauth_id;
		user.secret = dto.secret ?? user.secret;
		user.avatar_base = dto.avatar_base ?? user.avatar_base;
		user.auth_req = dto.auth_req ? AuthLevel[dto.auth_req] : user.auth_req;
		await this.userRepo.save(user);
		return user;
	}

	@Get('userdel')
	async userdel(@Query() dto: UserDto) {
		const user = await this.userRepo.findOneBy({ username: dto.username });
		if (!user)
			throw new HttpException('user does not exist', HttpStatus.NOT_FOUND);
		await this.userRepo.remove(user);
		return 'deleted user';
	}

	@Get('su')
	async su(
		@GetUserQuery() user: User,
		@Req() request: Request,
	) {
		this.sessionUtils.regenerate_session(request.session);
		request.session.user_id = user.id;
		request.session.auth_level = user.auth_req;
		return user;
	}

	@Get('id')
	async id(@Query() dto: UserDto) {
		const user = await this.userRepo.findOneBy({ username: dto.username });
		if (!user)
			throw new HttpException('user does not exist', HttpStatus.NOT_FOUND);
		return user;
	}

	@Get('lsuser')
	async lsuser() {
		const users = await this.userRepo.find();
		return { users: users };
	}
}