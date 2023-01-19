import { Controller, Get, Inject, Param, HttpException, HttpStatus, Body, UseInterceptors, UploadedFile, ParseFilePipeBuilder, UseGuards, ClassSerializerInterceptor, Injectable, ExecutionContext, CanActivate, Res, Delete, Post, ParseIntPipe, PipeTransform, ArgumentMetadata, Put, HttpCode, SetMetadata } from '@nestjs/common';
import { Reflector }from '@nestjs/core';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response, Request } from 'express';
import { User } from '../entities/User';
import { FriendRequest } from '../entities/FriendRequest';
import { InstanceChecker, Repository } from 'typeorm';
import { IsString, Length, IsOptional, IsNumberString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser, GetUserByDTO, InjectUser, Me, ParseIDPipe } from '../util';
import { dataSource } from '../app.module';
import { randomBytes } from 'node:crypto';
import { open, rm } from 'node:fs/promises';
import { finished, Readable } from 'node:stream';
import { join } from 'path';
import { AVATAR_DIR, DEFAULT_AVATAR } from '../vars';
import isNumeric from 'validator/lib/isNumeric';
import isInt from 'validator/lib/isInt';
import isLength from 'validator/lib/isLength';
import { instanceToPlain } from 'class-transformer';
import * as sharp from 'sharp';

declare module 'express' {
	export interface Request {
		user?: User;
	}
}

class UsernameDTO {
	@IsString()
	@Length(3, 20)
	username: string;
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
		const user = await dataSource.getRepository(User).findOneBy({
			id: request.session.user_id
		});
		if (user.username == null) {
			response.status(403).json('no username set');
			return false;
		}
		return true;
	}
}

@Injectable()
export class UserService {
	constructor(
		@Inject('USER_REPO')
		private readonly user_repo: Repository<User>,
		@Inject('FRIENDREQUEST_REPO')
		private readonly request_repo: Repository<FriendRequest>
	) {}

	async get_all() {
		return this.user_repo.find();
	}

	async get_user(user: User) {
		return user;
	}

	async set_username(user: User, username: string) {
		if (await this.user_repo.findOneBy({ username: username }))
			throw new HttpException('user with that username already exists', HttpStatus.FORBIDDEN);
		user.username = username;
		return this.user_repo.save(user);
	}

	async set_avatar(user: User, avatar_file: Express.Multer.File) {
		let new_base;
		do {
			new_base = user.id + randomBytes(20).toString('hex');
		} while (new_base === user.avatar_base);

		const transform = sharp().resize(200, 200).jpeg();
		//TODO catch possible exception thrown by open
		const file = await open(join(AVATAR_DIR, new_base + '.jpg'), 'w');
		const stream = file.createWriteStream();

		const istream = new Readable();
		istream.push(avatar_file.buffer);
		istream.push(null);
		istream.pipe(transform).pipe(stream);

		const promise = new Promise((resolve, reject) => {
			finished(transform, async (error: Error) => {
				if (error) {
					reject({statusCode: HttpStatus.UNPROCESSABLE_ENTITY, statusMessage: 'bad image'});
				} else {
					try {
						if (user.avatar_base !== DEFAULT_AVATAR)
							await rm(user.avatar_path);
						user.avatar_base = new_base;
					} catch (ex) {
						console.error(ex);
						reject({statusCode: HttpStatus.INTERNAL_SERVER_ERROR, statusMessage: 'could not set image'});
					}
				}
				//TODO check if the files get properly closed on an exception
				stream.close();
				file.close();
				await this.user_repo.save(user);
				resolve(user);
			});
		});
		try {
			return await promise;
		} catch (error) {
			throw new HttpException(error.statusMessage, error.statusCode);
		}
	}

	async list_friends(user: User) {
		return user.friends;
	}

	async unfriend(user: User, target: User) {
		const user_friends = await user.friends;
		const friend_idx =  user_friends ? user_friends.findIndex((x: User) => x.id === target.id) : -1;
		if (friend_idx < 0) {
			throw new HttpException('not found', HttpStatus.NOT_FOUND);
		}

		const friend = user_friends[friend_idx];
		const friend_friends = await friend.friends;
		const idx = friend_friends ? friend_friends.findIndex((x: User) => x.id === user.id) : -1;

		user_friends.splice(friend_idx, 1);
		friend_friends.splice(idx, 1);
		return this.user_repo.save([user, friend]);
	}

	async list_requests(user: User) {
		return Promise.all(
			(await this.request_repo.findBy([
				{ from: { id: user.id } },
				{ to: { id: user.id } } ])
			).map(request => request.serialize()));
	}

	async create_request(user: User, target: User) {
		if (user.id === target.id)
			throw new HttpException('cannot befriend yourself', HttpStatus.UNPROCESSABLE_ENTITY);

		const user_friends = await user.friends;
		if (user_friends && user_friends.find((friend: User) => friend.id === target.id))
			throw new HttpException('already friends', HttpStatus.FORBIDDEN);

		if (await this.request_repo.findOneBy({ from: { id: user.id }, to: { id: target.id } }))
			throw new HttpException('already exists', HttpStatus.FORBIDDEN);

		const request = await this.request_repo.findOneBy({ from: { id: target.id }, to: { id: user.id } });
		if (request) {
			user.add_friend(target);
			target.add_friend(user);

			await this.request_repo.remove(request);
			await this.user_repo.save([user, target]);
		} else {
			const friend_request = new FriendRequest();
			friend_request.from = Promise.resolve(user);
			friend_request.to = Promise.resolve(target);
			await this.request_repo.save(friend_request);
		}
	}

	async delete_request(user: User, request: FriendRequest) {
		if (user.id !== (await request.from).id && user.id !== (await request.to).id)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);
		await this.request_repo.remove(request);
	}
}

@Controller('user(s)?/id')
@UseGuards(AuthGuard, InjectUser)
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {

	constructor(
		@Inject('USER_REPO')
		private readonly user_repo: Repository<User>,
		private readonly user_service: UserService
	) {}

	@Get(':id')
	@UseGuards(SetupGuard)
	async get_user(@Param('id', ParseIDPipe(User)) user: User) {
		return this.user_service.get_user(user);
	}

	@Put(':id/username')
	async set_username(
		@Me() me: User,
		@Param('id', ParseIDPipe(User)) user: User,
		@Body() dto: UsernameDTO,
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.set_username(user, dto.username);
	}

	@Get(':id/avatar')
	@UseGuards(SetupGuard)
	async get_avatar(
		@Param('id', ParseIDPipe(User)) user: User,
		@Res() response: Response
	) {
		response.redirect(user.avatar);
	}

	@Put(':id/avatar')
	@UseInterceptors(FileInterceptor('avatar'))
	@UseGuards(SetupGuard)
	async set_avatar(
		@Me() me: User,
		@Param('id', ParseIDPipe(User)) user: User,
		@UploadedFile(
			new ParseFilePipeBuilder().addMaxSizeValidator({
				maxSize: 10485760
			}).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }))
		uploaded_file: Express.Multer.File,
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return await this.user_service.set_avatar(user, uploaded_file);
	}

	@Get(':id/friends')
	@UseGuards(SetupGuard)
	async list_friends(
		@Me() me: User,
		@Param('id', ParseIDPipe(User)) user: User
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.list_friends(user);
	}

	@Delete(':id/friends/:friend_id')
	@UseGuards(SetupGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async unfriend(
		@Me() me: User,
		@Param('id', ParseIDPipe(User)) user: User,
		@Param('friend_id', ParseIDPipe(User)) friend: User
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.unfriend(user, friend);
	}

	@Get(':id/friends/requests')
	@UseGuards(SetupGuard)
	async list_requests(
		@Me() me: User,
		@Param('id', ParseIDPipe(User)) user: User
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.list_requests(user);
	}

	@Post(':id/friends/requests')
	@UseGuards(SetupGuard)
	async create_request(
		@Me() me: User,
		@Param('id', ParseIDPipe(User)) user: User,
		@Body('id', ParseIDPipe(User)) target, 
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.create_request(user, target);
	}

	@Delete(':id/friends/requests/:request_id')
	@UseGuards(SetupGuard)
	async delete_request(
		@Me() me: User,
		@Param('id', ParseIDPipe(User)) user: User,
		@Param('request_id', ParseIDPipe(FriendRequest)) request: FriendRequest
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		await this.user_service.delete_request(user, request);
	}
}

//TODO do not allow whitespaces in username
class ParseUsernamePipe implements PipeTransform {
	async transform(value: any, metadata: ArgumentMetadata) {
		if (!value || value === null)
			throw new HttpException('username not specified', HttpStatus.BAD_REQUEST);
		if (typeof value !== 'string')
			throw new HttpException('username must be a string', HttpStatus.BAD_REQUEST);
		if (!isLength(value, { min: 3, max: 20 }))
			throw new HttpException('username must be 3 to 20 characters long', HttpStatus.BAD_REQUEST);
		const entity = await dataSource.getRepository(User).findOneBy({ username: value });
		if (!entity)
			throw new HttpException('user not found', HttpStatus.NOT_FOUND);
		return entity;
	}
}

@Controller('user(s)?/me')
@UseGuards(AuthGuard, InjectUser)
@UseInterceptors(ClassSerializerInterceptor)
export class MeController {

	constructor(
		@Inject('USER_REPO')
		private readonly user_repo: Repository<User>,
		private readonly user_service: UserService
	) {}

	@Get()
	@UseGuards(SetupGuard)
	async get_all(@Me() user: User) {
		return this.user_service.get_user(user);
	}

	@Put('username')
	async set_username(
		@Me() user: User,
		@Body() dto: UsernameDTO,
	) {
		return this.user_service.set_username(user, dto.username);
	}

	@Get('avatar')
	@UseGuards(SetupGuard)
	async get_avatar(
		@Me() user: User,
		@Res() response: Response
	) {
		response.redirect(user.avatar);
	}

	@Put('avatar')
	@UseInterceptors(FileInterceptor('avatar'))
	@UseGuards(SetupGuard)
	async set_avatar(
		@Me() user: User,
		@UploadedFile(
			new ParseFilePipeBuilder().addMaxSizeValidator({
				maxSize: 10485760
			}).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }))
		uploaded_file: Express.Multer.File,
	) {
		return await this.user_service.set_avatar(user, uploaded_file);
	}

	@Get('friends')
	@UseGuards(SetupGuard)
	async list_friends(
		@Me() user: User
	) {
		return this.user_service.list_friends(user);
	}

	@Delete('friends/:friend_id')
	@UseGuards(SetupGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async unfriend(
		@Me() user: User,
		@Param('friend_id', ParseUsernamePipe) friend: User
	) {
		return this.user_service.unfriend(user, friend);
	}

	@Get('friends/requests')
	@UseGuards(SetupGuard)
	async list_requests(
		@Me() user: User,
	) {
		return this.user_service.list_requests(user);
	}

	@Post('friends/requests')
	@UseGuards(SetupGuard)
	async create_request(
		@Me() user: User,
		@Body('id', ParseIDPipe(User)) target: User
	) {
		return this.user_service.create_request(user, target);
	}

	@Delete('friends/requests/:request_id')
	@UseGuards(SetupGuard)
	async delete_request(
		@Me() user: User,
		@Param('request_id', ParseIDPipe(FriendRequest)) request: FriendRequest
	) {
		await this.user_service.delete_request(user, request);
	}
}

@Controller('user(s)?/')
@UseGuards(AuthGuard, InjectUser)
@UseInterceptors(ClassSerializerInterceptor)
export class UsernameController {

	constructor(
		@Inject('USER_REPO')
		private readonly user_repo: Repository<User>,
		private readonly user_service: UserService
	) {}

	@Get()
	@UseGuards(SetupGuard)
	async get_all() {
		return this.user_service.get_all();
	}

	@Get(':username')
	@UseGuards(SetupGuard)
	async get_user(@Param('username', ParseUsernamePipe) user: User) {
		return this.user_service.get_user(user);
	}

	@Put(':username/username')
	async set_username(
		@Me() me: User,
		@Param('username', ParseUsernamePipe) user: User,
		@Body() dto: UsernameDTO,
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.set_username(user, dto.username);
	}

	@Get(':username/avatar')
	@UseGuards(SetupGuard)
	async get_avatar(
		@Param('username', ParseUsernamePipe) user: User,
		@Res() response: Response
	) {
		response.redirect(user.avatar);
	}

	@Put(':username/avatar')
	@UseInterceptors(FileInterceptor('avatar'))
	@UseGuards(SetupGuard)
	async set_avatar(
		@Me() me: User,
		@Param('username', ParseUsernamePipe) user: User,
		@UploadedFile(
			new ParseFilePipeBuilder().addMaxSizeValidator({
				maxSize: 10485760
			}).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }))
		uploaded_file: Express.Multer.File,
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return await this.user_service.set_avatar(user, uploaded_file);
	}

	@Get(':username/friends')
	@UseGuards(SetupGuard)
	async list_friends(
		@Me() me: User,
		@Param('username', ParseUsernamePipe) user: User
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.list_friends(user);
	}

	@Delete(':username/friends/:friend_id')
	@UseGuards(SetupGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async unfriend(
		@Me() me: User,
		@Param('username', ParseUsernamePipe) user: User,
		@Param('friend_id', ParseUsernamePipe) friend: User
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.unfriend(user, friend);
	}

	@Get(':username/friends/requests')
	@UseGuards(SetupGuard)
	async list_requests(
		@Me() me: User,
		@Param('username', ParseUsernamePipe) user: User
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.list_requests(user);
	}

	@Post(':username/friends/requests')
	@UseGuards(SetupGuard)
	async create_request(
		@Me() me: User,
		@Param('username', ParseUsernamePipe) user: User,
		@Body('id', ParseIDPipe(User)) target: User
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.create_request(user, target);
	}

	@Delete(':username/friends/requests/:request_id')
	@UseGuards(SetupGuard)
	async delete_request(
		@Me() me: User,
		@Param('username', ParseUsernamePipe) user: User,
		@Param('request_id', ParseIDPipe(FriendRequest)) request: FriendRequest
	) {
		if (user.id !== me.id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		await this.user_service.delete_request(user, request);
	}
}
