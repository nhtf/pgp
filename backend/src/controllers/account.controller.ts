import {
	Body,
	CanActivate,
	ClassSerializerInterceptor,
	Controller,
	ExecutionContext,
	Get,
	Patch,
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
	Redirect,
} from '@nestjs/common';
import { IsNumberString, IsOptional, IsString, Length } from 'class-validator';
import { Request, Response } from 'express';
import { open, rm } from 'node:fs/promises';
import { finished, Readable } from 'node:stream';
import { join, } from 'path';
import * as sharp from 'sharp';
import { Repository } from 'typeorm';
import { AuthGuard } from '../auth/auth.guard';
import { FriendRequest } from '../entities/FriendRequest';
import { User } from '../entities/User';
import { SessionObject } from '../SessionUtils';
import { GetUser, GetUserQuery } from '../util';
import { AVATAR_DIR, BACKEND_ADDRESS, DEFAULT_AVATAR } from '../vars';
import { dataSource } from '../app.module';
import { randomBytes } from 'node:crypto';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';


//TODO refactor backend so that user are gotten by BACKEND_ADDRESS/users/{username|id}
//and that friend requests are located in BACKEND_ADDRESS/requests/
//where you can create a friend request by a POST on that addres and DELETE a specific request
//by BACKEND/requests/{id} DELETE etc...

class UsernameDTO {
	@IsString()
	@Length(1, 20)
	@IsOptional()
	username?: string;

	@IsNumberString()
	@IsOptional()
	id?: number;
}

class DenyFriendRequestDTO {
	@IsNumberString()
	id!: string;
}

//TODO for POST requests, pass data via body not query

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
		const user = await dataSource.getRepository(User).findOneBy({ id: request.session.user_id });
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

		user.username = username_dto.username;
		user.friends = Promise.resolve([]);
	
		try {
			await this.userRepo.save(user);
		} catch (err) {
			throw new HttpException("A user with this name already exists", HttpStatus.CONFLICT);
		}
		
		return {};
	}

	@Patch('rename')
	@HttpCode(HttpStatus.CREATED)
	async rename(@GetUser() user: User, @Body() dto: UsernameDTO) {
		if (await this.userRepo.findOneBy({ username: dto.username }))
			throw new HttpException('username already taken', HttpStatus.BAD_REQUEST);
		user.username = dto.username;
		await this.userRepo.save(user);
	}

	get_avatar_filename(id: number) {
		return id.toString() + '.jpg';
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
	@Redirect(BACKEND_ADDRESS + '/user/me', HttpStatus.PERMANENT_REDIRECT)
	async whoami(@GetUser() user: User) {
		return user;
	}

	@Get('whois')
	async whois(
		@GetUserQuery() user: User,
		@Res() response: Response,
	) {
		response.redirect(HttpStatus.PERMANENT_REDIRECT, BACKEND_ADDRESS + '/user/id/' + user.id);
	}

	@Post('set_image')
	@UseGuards(SetupGuard)
	@UseInterceptors(FileInterceptor('file'))
	async set_image(
		@GetUser() user: User,
		@UploadedFile(
			new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 10485760 }).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }))
		uploaded_file: Express.Multer.File,
		@Req() request: Request,
		@Res() response: Response,
	) {
		if (!uploaded_file)
			throw new HttpException('no file', HttpStatus.BAD_REQUEST);

		let new_base = null;
		do {
			new_base = user.id + randomBytes(20).toString('hex');
		} while (new_base === user.avatar_base);

		const transform = sharp().resize(200, 200).jpeg();
		const file = await open(join(AVATAR_DIR, new_base + '.jpg'), 'w');
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
					if (user.avatar_base != DEFAULT_AVATAR)
						await rm(user.avatar_path);
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

	@Post('delete_request')
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(SetupGuard)
	async delete_request(@GetUser() user: User, @Body() dto: DenyFriendRequestDTO) {
		const request = await this.requestRepo.findOneById(dto.id);

		if (!request)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);

		const from = await request.from;
		const to = await request.to;
		if (from.id  !== user.id && to.id !== user.id)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);
		await this.requestRepo.remove(request);
	}

	@Post('befriend')
	@UseGuards(SetupGuard)
	async befriend(
		@GetUser() me: User,
		@GetUserQuery() target: User,
	) {
		if (target.id === me.id)
			throw new HttpException(
				'you cannot befriend yourself :/',
				HttpStatus.BAD_REQUEST,
			);

		const my_friends = await me.friends;

		if (my_friends.find((user) => user.id == target.id))
			throw new HttpException(
				'already friends with this user',
				HttpStatus.TOO_MANY_REQUESTS,
			);

		const outstanding_request = await this.requestRepo.findOne({
			where: {
				from: {
					id: me.id,
				},
				to: {
					id: target.id,
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
					id: target.id,
				},
				to: {
					id: me.id,
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
			to: { id: me.id },
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
		@GetUserQuery() target: User,
	) {
		const my_friends = await me.friends;
		const target_idx = my_friends
			? my_friends.findIndex((user: User) => user.id == target.id)
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
