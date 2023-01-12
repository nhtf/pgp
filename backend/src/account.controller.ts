import {
	Body,
	CanActivate,
	ClassSerializerInterceptor,
	Controller,
	ExecutionContext,
	Get,
	HttpCode,
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
	Post,
	Req,
	Res,
	Session,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	ParseFilePipeBuilder,
} from '@nestjs/common';
import { IsNumberString, IsOptional, IsString, Length } from 'class-validator';
import { Request, Response } from 'express';
import { open, rm } from 'node:fs/promises';
import { finished, Readable } from 'node:stream';
import { join } from 'path';
import * as sharp from 'sharp';
import { Repository } from 'typeorm';
import { AuthGuard } from './auth/auth.guard';
import { FriendRequest } from './entities/FriendRequest';
import { User } from './entities/User';
import { SessionObject } from './SessionUtils';
import { GetUser, GetUserQuery } from './util';
import { AVATAR_DIR, BACKEND_ADDRESS } from './vars';
import { dataSource } from './app.module';
import { randomBytes } from 'node:crypto';

import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

class UsernameDTO {
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
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const http = context.switchToHttp();
		const request = http.getRequest();
		const response = http.getResponse();
		if (request.session.user_id == undefined) {
			response.status(400).json('bad request');
			return false;
		}
		const user = await dataSource.getRepository(User).findOneBy({ user_id: request.session.user_id });
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
	constructor(
		@Inject('USER_REPO')
		private readonly userRepo: Repository<User>,
		@Inject('FRIENDREQUEST_REPO')
		private requestRepo: Repository<FriendRequest>,
	) { }

	@Post('setup')
	@HttpCode(HttpStatus.CREATED)
	async setup(
		@GetUser() user: User,
		@Body() username_dto: UsernameDTO,
		@Session() session: SessionObject,
	) {
		if (user.username !== null)
			throw new HttpException('already setup user', HttpStatus.FORBIDDEN);

		const other_user = await this.userRepo.findOneBy({
			username:
				username_dto.username,
		});
		if (other_user)
			throw new HttpException('username already taken', HttpStatus.BAD_REQUEST);
		user.username = username_dto.username;
		user.friends = Promise.resolve([]);
		user.online = true;
		await this.userRepo.save(user);
	}

	@Post('rename')
	@HttpCode(HttpStatus.CREATED)
	async rename(@GetUser() user: User, @Body() dto: UsernameDTO) {
		if (await this.userRepo.findOneBy({ username: dto.username }))
			throw new HttpException('username already taken', HttpStatus.BAD_REQUEST);
		user.username = dto.username;
		await this.userRepo.save(user);
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
	async whois(
		@GetUserQuery({ username: 'username', user_id: 'user_id' }) user: User,
	) {
		return user;
	}

	@Post('set_image')
	@UseGuards(SetupGuard)
	@UseInterceptors(FileInterceptor('file'))
	async set_image(
		@GetUser() user: User,
		@UploadedFile(
			new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 5242880 }).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }))
		uploaded_file: Express.Multer.File,
		@Req() request: Request,
		@Res() response: Response,
	) {
		if (!uploaded_file)
			throw new HttpException('no file', HttpStatus.BAD_REQUEST);
		const avatar_path = join(
			AVATAR_DIR,
			this.get_avatar_filename(user.user_id),
		);

		let new_base = null;
		while ((new_base = randomBytes(20).toString('hex')) === user.username)
			continue;

		const transform = sharp().resize(200, 200).jpeg();
		const file = await open(user.avatar_path(new_base), 'w');
		const stream = file.createWriteStream();

		const istream = new Readable();
		istream.push(uploaded_file.buffer);
		istream.push(null);
		istream.pipe(transform).pipe(stream);

		finished(transform, async (error: Error) => {
			try {
				if (error) {
					response.status(HttpStatus.BAD_REQUEST).json('bad image');
				} else {
					//TODO catch exceptions
					if (user.avatar_base)
						await rm(user.avatar_path(user.avatar_base));
					user.avatar_base = new_base;
					response.status(HttpStatus.ACCEPTED).json({ new_avatar: user.avatar });
					this.userRepo.save(user);
				}
				stream.close();
				file.close();
			} catch (error) {
				response.status(HttpStatus.INTERNAL_SERVER_ERROR).json('could not set image');
				console.error(error);
			}
			return response.send();
		});
	}

	@Post('befriend')
	@UseGuards(SetupGuard)
	async befriend(
		@GetUser() me: User,
		@GetUserQuery({ username: 'username', user_id: 'user_id' }) target: User,
	) {
		if (target.user_id === me.user_id)
			throw new HttpException(
				'you cannot befriend yourself :/',
				HttpStatus.BAD_REQUEST,
			);

		const my_friends = await me.friends;

		if (my_friends.find((user) => user.user_id == target.user_id))
			throw new HttpException(
				'already friends with this user',
				HttpStatus.TOO_MANY_REQUESTS,
			);

		const outstanding_request = await this.requestRepo.findOne({
			where: {
				from: {
					user_id: me.user_id,
				},
				to: {
					user_id: target.user_id,
				},
			},
		});
		if (outstanding_request)
			throw new HttpException(
				'already sent a friend request to this user',
				HttpStatus.TOO_MANY_REQUESTS,
			);

		const incoming_request = await this.requestRepo.findOne({
			where: {
				from: {
					user_id: target.user_id,
				},
				to: {
					user_id: me.user_id,
				},
			},
		});

		if (incoming_request) {
			me.add_friend(target);
			target.add_friend(me);

			await this.requestRepo.remove(incoming_request);
			await this.userRepo.save([me, target]);
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
		const requests = await this.requestRepo.findBy({
			to: { user_id: me.user_id },
		});
		return await Promise.all(
			requests.map((request) => {
				return request.serialize();
			}),
		);
	}

	@Post('unfriend')
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(SetupGuard)
	async unfriend(
		@GetUser() me: User,
		@GetUserQuery({ username: 'username', user_id: 'user_id' }) target: User,
	) {
		if (target.user_id === me.user_id)
			throw new HttpException(
				'you cannot unfriend yourself :/',
				HttpStatus.BAD_REQUEST,
			);

		const my_friends = await me.friends;
		const target_idx = my_friends
			? my_friends.findIndex((user: User) => user.user_id == target.user_id)
			: -1;

		if (target_idx < 0)
			throw new HttpException(
				'you are already not friends with this user',
				HttpStatus.BAD_REQUEST,
			);

		const target_friends = await target.friends;
		const me_idx = target_friends.indexOf(me);

		my_friends.splice(target_idx, 1);
		target_friends.splice(me_idx, 1);
		await this.userRepo.save([me, target]);
	}

}
