import { Controller, Get, Inject, Param, HttpException, HttpStatus, Body, UseInterceptors, UploadedFile, ParseFilePipeBuilder, UseGuards, ClassSerializerInterceptor, Injectable, ExecutionContext, CanActivate, Res, Delete, Post, ParseIntPipe, PipeTransform, ArgumentMetadata, Put, HttpCode, SetMetadata } from '@nestjs/common';
import { Reflector }from '@nestjs/core';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response, Request } from 'express';
import { User } from '../entities/User';
import { FriendRequest } from '../entities/FriendRequest';
import { InstanceChecker, Repository } from 'typeorm';
import { IsString, Length, IsOptional, IsNumberString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser, GetUserByDTO, Me } from '../util';
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

class RequestDTO {
	@IsNumberString()
	user_id!: string;
}

@Injectable()
export class InjectUser implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const http = context.switchToHttp();
		const request = http.getRequest();
		const response = http.getResponse();
		if (request.session.user_id == undefined) {
			response.status(400).json('bad request');
			return false;
		}
		const user = await dataSource.getRepository(User).findOneBy({
			user_id: request.session.user_id
		});
		request.user = user;
		return true;
	}
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
			user_id: request.session.user_id
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
			new_base = user.user_id + randomBytes(20).toString('hex');
		} while (new_base === user.avatar_base);

		const transform = sharp().resize(200, 200).jpeg();
		const file = await open(join(AVATAR_DIR, new_base + '.jpg'), 'w');
		const stream = file.createWriteStream();

		const istream = new Readable();
		istream.push(avatar_file.buffer);
		istream.push(null);
		istream.pipe(transform).pipe(stream);

		const promise = new Promise((resolve, reject) => {
			finished(transform, async (error: Error) => {
				if (error) {
					reject({statusCode: 400, statusMessage: 'bad image'});
				} else {
					try {
						if (user.avatar_base !== DEFAULT_AVATAR)
							await rm(user.avatar_path);
						user.avatar_base = new_base;
					} catch (ex) {
						console.error(ex);
						reject({statusCode: 500, statusMessage: 'could not set image'});
					}
				}
				stream.close();
				file.close();
				await this.user_repo.save(user);
				resolve(user);
			});
		});
		return promise;
	}

	async list_friends(user: User) {
		return user.friends;
	}

	async unfriend(user: User, target: User) {
		const user_friends = await user.friends;
		const friend_idx =  user_friends ? user_friends.findIndex((x: User) => x.user_id === target.user_id) : -1;
		if (friend_idx < 0) {
			throw new HttpException('not found', HttpStatus.NOT_FOUND);
		}

		const friend = user_friends[friend_idx];
		const friend_friends = await friend.friends;
		const user_idx = friend_friends ? friend_friends.findIndex((x: User) => x.user_id === user.user_id) : -1;

		user_friends.splice(friend_idx, 1);
		friend_friends.splice(user_idx, 1);
		return this.user_repo.save([user, friend]);
	}

	async list_requests(user: User) {
		return Promise.all(
			(await this.request_repo.findBy([
				{ from: { user_id: user.user_id } },
				{ to: { user_id: user.user_id } } ])
			).map(request => request.serialize()));
	}

	async create_request(user: User, target: User) {
		if (user.user_id === target.user_id)
			throw new HttpException('cannot befriend yourself', HttpStatus.UNPROCESSABLE_ENTITY);

		const user_friends = await user.friends;
		if (user_friends && user_friends.find((friend: User) => friend.user_id === target.user_id))
			throw new HttpException('already friends', HttpStatus.FORBIDDEN);

		if (await this.request_repo.findOneBy({ from: { user_id: user.user_id }, to: { user_id: target.user_id } }))
			throw new HttpException('already exists', HttpStatus.FORBIDDEN);

		const request = await this.request_repo.findOneBy({ from: { user_id: target.user_id }, to: { user_id: user.user_id } });
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

	async delete_request(user: User, request_id: number) {
		const request = await this.request_repo.findOneById(request_id);
		if (!request)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);

		if (user.user_id !== (await request.from).user_id && user.user_id !== (await request.to).user_id)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);
		await this.request_repo.remove(request);
	}
}

export function ParseIDPipe(type: any) {
	return class ParseIDPipe implements PipeTransform {
		async transform(value: any, metadata: ArgumentMetadata) {
			if (!value || value === null)
				throw new HttpException('id not specified', HttpStatus.BAD_REQUEST);
			if (!['string', 'number'].includes(typeof value))
				throw new HttpException('id must be either a string or an number', HttpStatus.BAD_REQUEST);
			if (!isNumeric(value, { no_symbols: true }))
				throw new HttpException('id must consist of only digits', HttpStatus.BAD_REQUEST);
			const id = Number(value);
			if (!isFinite(id))
				throw new HttpException('id must be finite', HttpStatus.UNPROCESSABLE_ENTITY);
			if (id > Number.MAX_SAFE_INTEGER)
				throw new HttpException(`id may not be larger that ${Number.MAX_SAFE_INTEGER}`, HttpStatus.UNPROCESSABLE_ENTITY);
			const entity = await dataSource.getRepository(type).findOneBy({ id: Number(value) });
			if (!entity)
				throw new HttpException('user not found', HttpStatus.NOT_FOUND);
			return entity;
		}
	};
}


//TODO implement for both username and user_id
//probaly like this
//BACKEND_ADDRESS/user/id/1
//and
//BACKEND_ADDRESS/user/username
//
//
//TODO check if there is a better way to handle view and editing permissions

@Controller('user(s)?/id')
@UseGuards(AuthGuard, InjectUser)
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {

	constructor(
		@Inject('USER_REPO')
		private readonly user_repo: Repository<User>,
		private readonly user_service: UserService
	) {}

	async select_user(id: any, me: User) {
		if (typeof id === 'number') {
			return dataSource.getRepository(User).findOneById(id);
		} else if (typeof id === 'string') {
			if (id === 'me') {
				return Promise.resolve(me);
			} 
			const user = await dataSource.getRepository(User).findOneBy({ username: id });
			if (user)
				return user;
			if (isNumeric(id, { no_symbols: true })) {
				return dataSource.getRepository(User).findOneById(id);
			}
		}
		return Promise.resolve(null);
	}

	@Get()
	@UseGuards(SetupGuard)
	async get_all() {
		return this.user_service.get_all();
	}

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
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.set_username(user, dto.username);
	}

	@Get(':id/avatar')
	async get_avatar(
		@Param('id', ParseIDPipe(User)) user: User,
		@Res() response: Response
	) {
		response.redirect(user.avatar);
	}

	@Put(':id/avatar')
	@UseInterceptors(FileInterceptor('avatar'))
	async set_avatar(
		@Me() me: User,
		@Param('id', ParseIDPipe(User)) user: User,
		@UploadedFile(
			new ParseFilePipeBuilder().addMaxSizeValidator({
				maxSize: 10485760
			}).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }))
		uploaded_file: Express.Multer.File,
	) {
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return await this.user_service.set_avatar(user, uploaded_file);
	}

	@Get(':id/friends')
	@UseGuards(SetupGuard)
	async list_friends(
		@Me() me: User,
		@Param('id', ParseIDPipe(User)) user: User
	) {
		if (user.user_id !== me.user_id)
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
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.unfriend(user, friend);
	}

	@Get(':id/friends/requests')
	@UseGuards(SetupGuard)
	async list_requests(
		@Me() me: User,
		@Param('id', ParseIDPipe(User)) user: User
	) {
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return this.user_service.list_requests(user);
	}

	@Post(':id/friends/requests')
	@UseGuards(SetupGuard)
	async create_request(
		@Me() me: User,
		@Param('id', ParseIDPipe(User)) user: User,
		@Body() dto: RequestDTO
	) {
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);

		const target = await this.user_repo.findOneById(dto.user_id);
		if (!target)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);
		return this.user_service.create_request(user, target);
	}

	@Delete(':id/friends/requests/:request_id')
	@UseGuards(SetupGuard)
	async delete_request(
		@Me() me: User,
		@Param('id', ParseIDPipe(User)) user: User,
		@Param('request_id', ParseIntPipe) request_id: number
	) {
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		await this.user_service.delete_request(user, request_id);
	}
}
