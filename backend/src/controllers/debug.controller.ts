import {
	Controller,
	Inject,
	HttpException,
	HttpStatus,
	Req,
	Get,
	Query,
	UseGuards,
} from "@nestjs/common";
import {
	Length,
	IsString,
	IsOptional,
	IsInt,
	IsEnum,
} from "class-validator";
import { User } from "../entities/User";
import { AuthLevel } from "../enums/AuthLevel";
import { Repository } from "typeorm";
import { Request } from "express";
import { SessionService } from "src/services/session.service"
import { ParseIDPipe } from "../util";
import { Room } from "src/entities/Room";
import { Member } from "src/entities/Member";
import { DEFAULT_AVATAR } from "../vars";
import { Invite } from "src/entities/Invite";
import { Role } from "src/enums/Role";

import { HttpAuthGuard } from "src/auth/auth.guard";
import { Message } from "src/entities/Message";

class UserDTO {
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
@Controller("debug")
export class DebugController {
	constructor(
		private readonly sessionUtils: SessionService,
		@Inject("USER_REPO")
		private readonly userRepo: Repository<User>,
		@Inject("ROOM_REPO")
		private readonly roomRepo: Repository<Room>,
		@Inject("MEMBER_REPO")
		private readonly memberRepo: Repository<Member>,
		@Inject("INVITE_REPO")
		private readonly inviteRepo: Repository<Invite>,
		@Inject("MESSAGE_REPO")
		private readonly messageRepo: Repository<Message>,
	) {}

	@Get("useradd")
	async useradd(@Query() dto: UserDTO) {
		// const exists = dto.username ?
		// 	(await this.userRepo.findOneBy({ username: dto.username })) !== null : false;
		// if (exists)
		// 	throw new HttpException(
		// 		"an user with that username already exists",
		// 		HttpStatus.BAD_REQUEST,
		// 	);

		const user = new User();
		user.username = dto.username;
		user.oauth_id = dto.oauth_id ?? -1;
		user.secret = dto.secret;
		user.avatar_base = dto.avatar_base ?? DEFAULT_AVATAR;
		user.auth_req = dto.secret ? AuthLevel.TWOFA : AuthLevel.OAuth;
	
		try {
			await this.userRepo.save(user);
		} catch (err) {
			if (err.code == 23505) {
				throw new HttpException("A user with this name already exists", HttpStatus.FORBIDDEN);
			}
			throw new HttpException(err.message, HttpStatus.BAD_GATEWAY);
		}
		return user;
	}

	@Get("usermod")
	async usermod(@Query() dto: UserDTO) {
		const user = await this.userRepo.findOneBy({ username: dto.username });
		if (!user)
			throw new HttpException("user does not exist", HttpStatus.NOT_FOUND);
		user.oauth_id = dto.oauth_id ?? user.oauth_id;
		user.secret = dto.secret ?? user.secret;
		user.avatar_base = dto.avatar_base ?? user.avatar_base;
		user.auth_req = dto.auth_req ? AuthLevel[dto.auth_req] : user.auth_req;
		await this.userRepo.save(user);
		return user;
	}

	@Get("userdel")
	async userdel(@Query() dto: UserDTO) {
		const user = await this.userRepo.findOneBy({ username: dto.username });
		if (!user)
			throw new HttpException("user does not exist", HttpStatus.NOT_FOUND);
		await this.userRepo.remove(user);
		return "deleted user";
	}

	@Get("su")
	async su(
		@Query("id", ParseIDPipe(User)) user: User,
		@Req() request: Request,
	) {
		const res = await this.sessionUtils.regenerate_session_req(request);
		if (!res)
			throw new HttpException("could not regenerate session", HttpStatus.INTERNAL_SERVER_ERROR);
		request.session.user_id = user.id;
		request.session.auth_level = user.auth_req;
		return user;
	}

	@Get("id")
	async id(@Query() dto: UserDTO) {
		const user = await this.userRepo.findOneBy({ username: dto.username });
		if (!user)
			throw new HttpException("user does not exist", HttpStatus.NOT_FOUND);
		return user;
	}

	@Get("lsuser")
	async lsuser() {
		return this.userRepo.find({
			relations: {
				banned_rooms: true,
			},			
		});
	}

	@Get("rooms")
	async rooms() {
		return this.roomRepo.find({
			relations: {
				members: {
					user: true,
				},
				banned_users: true,
			}
		});
	}

	@Get("room/delete")
	async deleteRoom(@Query("id") id: string) {
		return await this.roomRepo.delete(Number(id));
	}

	@Get("members")
	async members() {
		return this.memberRepo.find({
			relations: {
				user: true,
				room: true,
			},
		});
	}

	@Get("invites")
	async invites() {
		return this.inviteRepo.find({
			relations: {
				from: true,
				to: true,
			},
		});
	}

	@Get("invite(s)?/delete")
	async deleteInvite(@Query("id") id: string) {
		return await this.inviteRepo.delete(Number(id));
	}

	@Get("room/setOwner")
	async setOwner(@Query("id") id: string) {
		const member = await this.memberRepo.findOneBy({ id: Number(id) });
	
		member.role = Role.OWNER;

		return await this.memberRepo.save(member);
	}

	@Get("test")
	@UseGuards(HttpAuthGuard)
	async test() {
		return "Test";
	}

	@Get("messages")
	async messages() {
		return await this.messageRepo.find();
	}

	@Get("message(s)?/delete")
	async deleteMessage(@Query("id") id: string) {
		return await this.messageRepo.delete(Number(id));
	}
}
