import { Body, CanActivate, ClassSerializerInterceptor, Controller, ExecutionContext, Get, HttpCode, HttpException, HttpStatus, Inject, Injectable, Post, Req, Res, Session, UseGuards, UseInterceptors } from '@nestjs/common';
import { IsNumberString, IsOptional, IsString, Length } from 'class-validator';
import { Request, Response } from 'express';
import { open } from 'node:fs/promises';
import { finished } from 'node:stream';
import { join } from 'path';
import * as sharp from 'sharp';
import { Repository } from 'typeorm';
import { AuthGuard } from './auth/auth.guard';
import { FriendRequest } from './entities/FriendRequest';
import { User } from './entities/User';
import { SessionObject } from './SessionUtils';
import { UserService } from './UserService';
import { GetUser, GetUserQuery } from './util';
import { AVATAR_DIR, BACKEND_ADDRESS } from './vars';

class UsernameDto {
	@IsString()
	@Length(1, 20)
	@IsOptional()
	username?: string;

	@IsNumberString()
	@IsOptional()
	user_id?: number;
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
@UseInterceptors(ClassSerializerInterceptor)
export class AccountController {

	constructor(private readonly user_service: UserService, @Inject('FRIENDREQUEST_REPO') private requestRepo: Repository<FriendRequest>) { }

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

	@Post('rename')
	@HttpCode(HttpStatus.CREATED)
	async rename(@GetUser() user: User, @Body() dto: UsernameDto) {
		if (await this.user_service.get_user_by_name(dto.username))
			throw new HttpException('username already taken', HttpStatus.BAD_REQUEST);
		user.username = dto.username;
		await this.user_service.save([user]);
	}

	get_avatar_filename(user_id: number) {
		return user_id.toString() + '.jpg';
	}

	get_avatar_path(avatar: string): string {
		return BACKEND_ADDRESS + '/' + AVATAR_DIR + '/' + avatar;
	}

	@Get('auth_req')
	@UseGuards(SetupGuard)
	async auth_req(@GetUser() user: User) {
		return user.auth_req;
	}

	@Get('whoami')
	@UseGuards(SetupGuard)
	async whoami(@GetUser() user: User) {
		return user;
	}

	@Get('whois')
	async whois(@GetUserQuery({ username: 'username', user_id: 'user_id' }) user: User) {
		return user;
	}

	//@deprecated use @GetUser and @GetUserQuery instead
	async get_user(dto: UsernameDto): Promise<User> {
		throw new HttpException('use of obsolete method', HttpStatus.GONE);
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

		const my_friends = await me.friends;

		if (my_friends.find(user => user.user_id == target.user_id))
			throw new HttpException('already friends with this user', HttpStatus.TOO_MANY_REQUESTS);

		const outstanding_request = await this.requestRepo.findOne({
			where: {
				from: {
					user_id: me.user_id
				},
				to: {
					user_id: target.user_id
				}
			}
		});
		if (outstanding_request)
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
			me.add_friend(target);
			target.add_friend(me);

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

	@Get('friends')
	@UseGuards(SetupGuard)
	async friend_list(@GetUser() me: User) {
		return await me.friends;
	}

	@Get('requests')
	@UseGuards(SetupGuard)
	async friend_requests(@GetUser() me: User) {
		const requests = await this.requestRepo.findBy({ to: { user_id: me.user_id } });
		return await Promise.all(requests.map(request => {
			return request.serialize();
		}));
	}

	@Post('unfriend')
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(SetupGuard)
	async unfriend(@GetUser() me: User,
		@GetUserQuery({ username: 'username', user_id: 'user_id' }) target: User) {
		if (target.user_id === me.user_id)
			throw new HttpException('you cannot unfriend yourself :/', HttpStatus.BAD_REQUEST);

		const my_friends = await me.friends;
		const target_idx = my_friends ? my_friends.findIndex((user: User) => user.user_id == target.user_id) : -1;

		if (target_idx < 0)
			throw new HttpException('you are already not friends with this user', HttpStatus.BAD_REQUEST);

		const target_friends = await target.friends;
		const me_idx = target_friends.indexOf(me);

		my_friends.splice(target_idx, 1);
		target_friends.splice(me_idx, 1);
		this.user_service.save([me, target]);
	}

	@Post('inviteToGame')
	@UseGuards(SetupGuard)
	async inviteToGame(@Session() session: SessionObject, @Body() dto: UsernameDto) {
		const target: User = await this.get_user(dto);
		if (!target)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);
		const me: User = await this.user_service.get_user({ user_id: session.user_id });
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
}
