import { Controller, Get, Inject, Param, HttpException, HttpStatus, Patch, Body, UseInterceptors, UploadedFile, ParseFilePipeBuilder, UseGuards, ClassSerializerInterceptor, Injectable, ExecutionContext, CanActivate, Res, Delete, Post, ParseIntPipe, PipeTransform, ArgumentMetadata, Put, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { User } from '../entities/User';
import { FriendRequest } from '../entities/FriendRequest';
import { InstanceChecker, Repository } from 'typeorm';
import { IsString, Length, IsOptional, IsNumberString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser, GetUserByDTO} from '../util';
import { dataSource } from '../app.module';
import { randomBytes } from 'node:crypto';
import { open, rm } from 'node:fs/promises';
import { finished, Readable } from 'node:stream';
import { join } from 'path';
import { AVATAR_DIR, DEFAULT_AVATAR } from '../vars';
import isNumeric from 'validator/lib/isNumeric';
import isLength from 'validator/lib/isLength';
import { instanceToPlain } from 'class-transformer';
import * as sharp from 'sharp';

class UsernameDTO {
	@IsString()
	@Length(3, 20)
	username: string;
}

//TODO delete
class EditDTO {
	@IsString()
	@Length(1, 20)
	@IsOptional()
	username: string;
}

class RequestDTO {
	@IsNumberString()
	user_id!: string;
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

async function id_to_user(id: any, me: User): Promise<User> {
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

class UserService {
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
//TODO implement for both username and user_id
//probaly like this
//BACKEND_ADDRESS/user/id/1
//and
//BACKEND_ADDRESS/user/username

@Controller('user(s)?')
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {

	constructor(
		@Inject('USER_REPO')
		private readonly user_repo: Repository<User>,
		@Inject('FRIENDREQUEST_REPO')
		private readonly request_repo: Repository<FriendRequest>
	) {}

	@Get()
	@UseGuards(SetupGuard)
	async get_all() {
		return await this.user_repo.find();
	}

	@Get(':id')
	@UseGuards(SetupGuard)
	async get_user(@GetUser() me: User, @Param('id') id: any) {
		const user = await id_to_user(id, me);
		if (user.user_id === me.user_id)
			return { ...instanceToPlain(user), auth_req: user.auth_req };
		return user;
	}

	@Put(':id/username')
	async set_username(
		@GetUser() me: User,
		@Param('id') id: any,
		@Body() dto: UsernameDTO,
	) {
		const user = await id_to_user(id, me);
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);

		if (await this.user_repo.findOneBy({ username: dto.username }))
			throw new HttpException('user with that username already exists', HttpStatus.FORBIDDEN);
		user.username = dto.username;
		return await this.user_repo.save(user);
	}

	@Get(':id/avatar')
	async get_avatar(
		@GetUser() me: User,
		@Param('id') id: any,
		@Res() response: Response
	) {
		const user = await id_to_user(id, me);
		response.redirect(user.avatar);
	}

	@Put(':id/avatar')
	@UseInterceptors(FileInterceptor('avatar'))
	async set_avatar(
		@GetUser() me: User,
		@Param('id') id: any,
		@UploadedFile(
			new ParseFilePipeBuilder().addMaxSizeValidator({
				maxSize: 10485760
			}).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }))
		uploaded_file: Express.Multer.File,
		@Res() response: Response
	) {
		const user = await id_to_user(id, me);
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);

		let new_base;
		do {
			new_base = user.user_id + randomBytes(20).toString('hex');
		} while (new_base === user.avatar_base);

		const transform = sharp().resize(200, 200).jpeg();
		const file = await open(join(AVATAR_DIR, new_base + '.jpg'), 'w');
		const stream = file.createWriteStream();

		const istream = new Readable();
		istream.push(uploaded_file.buffer);
		istream.push(null);
		istream.pipe(transform).pipe(stream);

		finished(transform, async (error: Error) => {
			if (error) {
				response.status(HttpStatus.BAD_REQUEST).json('bad image');
			} else {
				try {
					if (user.avatar_base !== DEFAULT_AVATAR)
						await rm(user.avatar_path);
					user.avatar_base = new_base;
					response.status(HttpStatus.OK).json(instanceToPlain(user));
				} catch (ex) {
					console.error(ex);
					response.status(HttpStatus.INTERNAL_SERVER_ERROR).json('could not set image');
				}
			}
			stream.close();
			file.close();
			await this.user_repo.save(user);
			return response.send();
		});
	}

	@Get(':id/friends')
	@UseGuards(SetupGuard)
	async friend_list(
		@GetUser() me: User,
		@Param('id') id: any
	) {
		const user = await id_to_user(id, me);
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		return await user.friends;
	}

	@Delete(':id/friends/:friend_id')
	@UseGuards(SetupGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async unfriend(
		@GetUser() me: User,
		@Param('id') id: any,
		@Param('friend_id', ParseIntPipe) friend_id: number 
	) {
		const user = await id_to_user(id, me);
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);

		const user_friends = await user.friends;
		const friend_idx =  user_friends ? user_friends.findIndex((x: User) => x.user_id === friend_id) : -1;
		if (friend_idx < 0) {
			throw new HttpException('not found', HttpStatus.NOT_FOUND);
		}

		const friend = user_friends[friend_idx];
		const friend_friends = await friend.friends;
		const user_idx = friend_friends ? friend_friends.findIndex((x: User) => x.user_id === user.user_id) : -1;

		user_friends.splice(friend_idx, 1);
		friend_friends.splice(user_idx, 1);
		await this.user_repo.save([user, friend]);
	}

	@Get(':id/friends/requests')
	@UseGuards(SetupGuard)
	async list_requests(
		@GetUser() me: User,
		@Param('id') id: any
	) {
		const user = await id_to_user(id, me);
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);

		return Promise.all(
			(await this.request_repo.findBy([
				{ from: { user_id: user.user_id } },
				{ to: { user_id: user.user_id } } ])
			).map(request => request.serialize()));
	}

	@Post(':id/friends/requests')
	@UseGuards(SetupGuard)
	async create_request(
		@GetUser() me: User,
		@Param('id') id: any,
		@Body() dto: RequestDTO
	) {
		const user = await id_to_user(id, me);
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);

		if (me.user_id === Number(dto.user_id))
			throw new HttpException('cannot befriend yourself', HttpStatus.UNPROCESSABLE_ENTITY);

		const target_user = await this.user_repo.findOneById(dto.user_id);
		if (!target_user)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);

		const user_friends = await user.friends;
		if (user_friends && user_friends.find((friend: User) => friend.user_id === target_user.user_id))
			throw new HttpException('already friends', HttpStatus.FORBIDDEN);

		if (await this.request_repo.findOneBy({ from: { user_id: user.user_id }, to: { user_id: target_user.user_id } }))
			throw new HttpException('already exists', HttpStatus.FORBIDDEN);

		const request = await this.request_repo.findOneBy({ from: { user_id: target_user.user_id }, to: { user_id: user.user_id } });
		if (request) {
			user.add_friend(target_user);
			target_user.add_friend(user);

			await this.request_repo.remove(request);
			await this.user_repo.save([user, target_user]);
		} else {
			const friend_request = new FriendRequest();
			friend_request.from = Promise.resolve(user);
			friend_request.to = Promise.resolve(target_user);
			await this.request_repo.save(friend_request);
		}
	}

	@Delete(':id/friends/requests/:request_id')
	@UseGuards(SetupGuard)
	async delete_request(
		@GetUser() me: User,
		@Param('id') id: any,
		@Param('request_id', ParseIntPipe) request_id: number
	) {
		const user = await id_to_user(id, me);
		if (user.user_id !== me.user_id)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);

		const request = await this.request_repo.findOneById(request_id);
		if (!request)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);

		if (user.user_id !== (await request.from).user_id && user.user_id !== (await request.to).user_id)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);
		await this.request_repo.remove(request);
	}
}
