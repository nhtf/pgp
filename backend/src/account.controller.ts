import { Controller, UseGuards, Post, Body, Session, HttpException, HttpStatus,
	Injectable, CanActivate, ExecutionContext, HttpCode, Get, Query,
	Req, Res, Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from './auth/auth.guard';
import { Length, IsString, IsOptional, IsNumberString, IsInt } from 'class-validator';
import { UserService } from './UserService';
import { SessionObject } from './SessionUtils';
import { Request, Response, Express } from 'express';
import * as sharp from 'sharp';
import { open, rm } from 'node:fs/promises';
import { finished } from 'node:stream';
import { join } from 'path';
import { AVATAR_DIR, DEFAULT_AVATAR, BACKEND_ADDRESS } from './vars';
import { Repository } from 'typeorm';
import { GetUser, GetUserQuery } from './util';
import { User } from './entities/User';
import { FriendRequest } from './entities/FriendRequest';

class UsernameDto {
	@IsString()
	@Length(1, 20)
	@IsOptional()
	username?: string;

	@IsNumberString()
	@IsOptional()
	user_id?: number;
}

class SimpleUser {
	user_id: number;
	username: string;
}

@Injectable()
export class SetupGuard implements CanActivate {
	constructor(private readonly user_service: UserService) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const http = context.switchToHttp();
		const request = http.getRequest();
		const response = http.getResponse();
		if (request.session.user_id == undefined) {
			response.status(400).json('bad request');
			return false;
		}
		const user = await this.user_service.get_user(request.session.user_id);
		if (user.username == null) {
			response.status(403).json('no username set');
			return false;
		}
		return true;
	}
}

@Controller('account')
@UseGuards(AuthGuard)
export class AccountController {

	constructor(private readonly user_service: UserService, @Inject('FRIENDREQUEST_REPO') private requestRepo: Repository<FriendRequest>) {}

	@Post('setup')
	@HttpCode(HttpStatus.CREATED)
	async setup(@Body() username_dto: UsernameDto, @Session() session: SessionObject) {
		const user = await this.user_service.get_user({ user_id: session.user_id });
		if (user.username !== null)
			throw new HttpException('already setup user', HttpStatus.FORBIDDEN);

		const other_user = await this.user_service.get_user_by_name(username_dto.username);
		if (other_user)
			throw new HttpException('username already taken', HttpStatus.BAD_REQUEST);
		user.username = username_dto.username;
		user.friends = Promise.resolve([]);
		user.online = true;
		//user.friend_requests = Promise.resolve([]);
		//user.friend_requests = [];
		await this.user_service.save([user]);
	}

	@Post('reset')
	@UseGuards(SetupGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async reset(@Session() session: SessionObject) {
		const user = await this.user_service.get_user({ user_id: session.user_id });
		user.username = null;
		user.has_avatar = false;
		await this.user_service.save([user]);
	}

	get_avatar_filename(user_id: number) {
		return user_id.toString() + '.jpg';
	}

	get_avatar_path(avatar: string): string {
		return BACKEND_ADDRESS + '/' + AVATAR_DIR + '/' + avatar;
	}

	async who(user: User) {
		const avatar = user.has_avatar ? this.get_avatar_filename(user.user_id) : DEFAULT_AVATAR;
		return { id: user.user_id, username: user.username, avatar: this.get_avatar_path(avatar) };
	}

	@Get('whoami')
	@UseGuards(SetupGuard)
	async whoami(@GetUser() user: User) {
		console.log(user);
		if (!user)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);
		return await this.who(user);
	}

	@Get('whois')
	async whois(@GetUserQuery({ username: 'username', user_id: 'user_id' }) user: User) {
		return await this.who(user);
	}

	async get_user(dto: UsernameDto): Promise<User> {
		if (!dto.username && !dto.user_id)
			throw new HttpException('bad request', HttpStatus.BAD_REQUEST);
		const user = dto.user_id ? await this.user_service.get_user({ user_id: Number(dto.user_id) })
								: await this.user_service.get_user({ username: dto.username });
		return user;
	}

	@Post('set_image')
	@UseGuards(SetupGuard)
	async set_image(@GetUser() user: User, @Req() request: Request, @Res() response: Response) {
		const avatar_path = join(AVATAR_DIR, this.get_avatar_filename(user.user_id));

		const transform = sharp().resize(200, 200).jpeg();
		const file = await open(avatar_path, 'w');
		const stream = file.createWriteStream();
		request.pipe(transform).pipe(stream);

		finished(transform, (error: Error) => {
			if (error) {
				response.status(HttpStatus.BAD_REQUEST).json("bad image");
			} else {
				response.status(HttpStatus.ACCEPTED);
				user.has_avatar = true;
				this.user_service.save([user]);
			}
			stream.close();
			file.close();
			return response.send();
		});
	}

	@Post('befriend')
	@UseGuards(SetupGuard)
	async befriend(@GetUser() me: User,
				   @GetUserQuery({ username: 'username', user_id: 'user_id' }) target: User) {
		if (target.user_id === me.user_id)
			throw new HttpException('you cannot befriend yourself :/', HttpStatus.BAD_REQUEST);

		const friends = await me.friends;

		if (friends.find(user => user.user_id == target.user_id))
			throw new HttpException('already friends with this user', HttpStatus.TOO_MANY_REQUESTS);

		const tmp = await this.requestRepo.findOne({
			where: {
				from: {
					user_id: me.user_id
				},
				to: {
					user_id: target.user_id
				}
			}
		});
		if (tmp)
			throw new HttpException('already sent a friend request to this user', HttpStatus.TOO_MANY_REQUESTS);

		const incoming_request = await this.requestRepo.findOne({
			where: {
				from: {
					user_id: target.user_id
				},
				to: {
					user_id: me.user_id
				}
			}
		});

		if (incoming_request) {
			if (!(await me.friends))
				me.friends = Promise.resolve([]);
			if (!(await target.friends))
				target.friends = Promise.resolve([]);
			(await me.friends).push(target);
			(await target.friends).push(me);
			await this.requestRepo.remove(incoming_request);
			await this.user_service.save([me, target]);
		} else {
			const request = new FriendRequest();
			request.from = Promise.resolve(me);
			request.to = Promise.resolve(target);
			request.date = new Date();
			await this.requestRepo.save(request);
		}
	}

	@Get('friend_list')
	@UseGuards(SetupGuard)
	async friend_list(@GetUser() me: User) {
		return await me.friends;
	}


	@Post('inviteToGame')
	@UseGuards(SetupGuard)
	async inviteToGame(@Session() session: SessionObject, @Body() dto: UsernameDto) {
		const target: User = await this.get_user(dto);
		if (!target)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);
		const me: User = await this.user_service.get_user({user_id: session.user_id});
		if (target.user_id === me.user_id)
			throw new HttpException('you cannot invite yourself to a game:/', HttpStatus.BAD_REQUEST);

		const tmp = await this.requestRepo.findOne({
			where: {
				from: {
					user_id: me.user_id
				},
				to: {
					user_id: target.user_id
				}
			}
		});
		if (tmp)
			throw new HttpException('already sent a game invite to this user', HttpStatus.TOO_MANY_REQUESTS);

		const incoming_request = await this.requestRepo.findOne({
			where: {
				from: {
					user_id: target.user_id
				},
				to: {
					user_id: me.user_id
				}
			}
		});

		// if (incoming_request) {
		// 	me.friends.push(target);
		// 	target.friends.push(me);
		// 	await this.requestRepo.remove(incoming_request);
		// } else {
		// 	const request = new GameRequest();
		// 	request.from = Promise.resolve(me);
		// 	request.to = Promise.resolve(target);
		// 	await this.requestRepo.save(request);
		// }
	}

	@Get('friends')
	@UseGuards(SetupGuard)
	async friends(@GetUser() me: User) {
		console.log(await me.sent_friend_requests);
		return { friends: me.friends };
	}

}
