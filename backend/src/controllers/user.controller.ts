import { Controller, Get, Inject, Param, HttpStatus, Body, UseInterceptors, UploadedFile, ParseFilePipeBuilder, UseGuards, ClassSerializerInterceptor,Res, Delete, Post, PipeTransform, ArgumentMetadata, Put, ForbiddenException, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express, Response } from "express";
import { User } from "../entities/User";
import { Invite } from "../entities/Invite";
import { FriendRequest } from "../entities/FriendRequest";
import { Repository, FindManyOptions } from "typeorm";
import { IsString, Matches } from "class-validator";
import { HttpAuthGuard } from "../auth/auth.guard";
import { Me, ParseIDPipe, ParseUsernamePipe } from "../util";
import { randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";
import { join } from "path";
import { AVATAR_DIR, DEFAULT_AVATAR, AVATAR_EXT } from "../vars";
import { SetupGuard } from "src/guards/setup.guard";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Action, Subject } from "src/enums";
import * as gm from "gm";

declare module "express" {
	export interface Request {
		user?: User;
	}
}

class UsernameDTO {
	@IsString()
	//@Length(3, 20)
	@Matches(/^(?!\0)\S(?:(?!\0)[ \S]){1,18}(?!\0)\S$/)
	username: string;
}

export function GenericUserController(route: string, options: { param: string, cparam: string, pipe: any }) {
	@Controller(route)
	@UseGuards(HttpAuthGuard)
	@UseInterceptors(ClassSerializerInterceptor)
	class UserControllerFactory {
		constructor(
			@Inject("USER_REPO")
			readonly user_repo: Repository<User>,
			@Inject("FRIENDREQUEST_REPO")
			readonly request_repo: Repository<FriendRequest>,
			@Inject("INVITE_REPO")
			readonly invite_repo: Repository<Invite>,
			readonly update_service: UpdateGateway,
		) { }

		@Get()
		@UseGuards(SetupGuard)
		async list_all() {
			return this.user_repo.find();
		}

		@Get(options.cparam)
		@UseGuards(SetupGuard)
		async get_user(
			@Me() me: User,
			@Param(options.param, options.pipe) user?: User
		) {
			return user || me;
		}

		@Put(options.cparam + "/username")
		async set_username(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User,
			@Body() dto: UsernameDTO,
		) {
			user = user || me;

			if (user.id !== me.id) {
				throw new ForbiddenException();
			}

			if (await this.user_repo.findOneBy({ username: dto.username })) {
				throw new ForbiddenException("Username taken");
			}

			return await this.user_repo.save({ id: user.id, username: dto.username });
		}

		@Get(options.cparam + "/avatar")
		@UseGuards(SetupGuard)
		async get_avatar(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User,
			@Res() response: Response,
		) {
			user = user || me;
			response.redirect(user.avatar);
		}

		@Put(options.cparam + "/avatar")
		@UseInterceptors(FileInterceptor("avatar"))
		@UseGuards(SetupGuard)
		async set_avatar(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User,
			@UploadedFile(
				new ParseFilePipeBuilder().addMaxSizeValidator({
					maxSize: 10485760
				}).build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }))
			uploaded_file: Express.Multer.File,
		) {
			user = user || me;
			if (user.id !== me.id)
				throw new ForbiddenException();

			let new_base = "";
			do {
				new_base = user.id + randomBytes(20).toString("hex");
			} while (new_base === user.avatar_base);

			// console.log(uploaded_file.buffer instanceof Buffer);
			const promise = new Promise((resolve, reject) => {
				gm.subClass({ imageMagick: true })(uploaded_file.buffer)
					.resize(256, 256, "!")
					.write(join(AVATAR_DIR, new_base + AVATAR_EXT), error => {
						if (error)
							reject(error);
						resolve("yes");
					});
			});

			try {
				const res = await promise;
			} catch (error) {
				console.error(error);
				throw new UnprocessableEntityException("Corrupted image");
			}
			if (user.avatar_base !== DEFAULT_AVATAR) {
				await rm(user.avatar_path);
			}

			user.avatar_base = new_base;
			user = await this.user_repo.save(user);

			// avatar is a getter and won't trigger the subscriber
			UpdateGateway.instance.send_update({
				subject: Subject.USER,
				action: Action.SET,
				id: user.id,
				value: { avatar: user.avatar }
			})
		
			return {};
		}

		@Get(options.cparam + "/auth_req")
		@UseGuards(SetupGuard)
		async get_auth_req(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User
		) {
			user = user || me;
			if (user.id !== me.id)
				throw new ForbiddenException();
			return user.auth_req;
		}

		@Get(options.cparam + "/friend(s)?")
		@UseGuards(SetupGuard)
		async list_friends(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User
		) {
			user = user || me;
			if (user.id !== me.id)
				throw new ForbiddenException();
			return this.user_repo.findBy({
				friends: {
					id: user.id
				},
			});
		}

		@Delete(options.cparam + "/friend(s)?/:friend_id")
		@UseGuards(SetupGuard)
		async unfriend(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User,
			@Param("friend_id", ParseIDPipe(User, { friends: true })) friend: User,
		) {
			user = user || me;
			if (user.id !== me.id)
				throw new ForbiddenException();

			const friend_idx = user.friends?.findIndex((x: User) => x.id === friend.id);
			if (friend_idx === undefined || friend_idx < 0)
				throw new NotFoundException();

			const user_idx = friend.friends.findIndex((x: User) => x.id === user.id);

			user.friends.splice(friend_idx, 1);
			friend.friends.splice(user_idx, 1);
			[user, friend] = await this.user_repo.save([user, friend]);

			user.send_friend_update(Action.REMOVE, friend);
			friend.send_friend_update(Action.REMOVE, user);

			return {};
		}

		@Get(options.cparam + "/friend(s)?/request(s)?")
		@UseGuards(SetupGuard)
		async list_requests(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User
		) {
			user = user || me;
			if (user.id !== me.id)
				throw new ForbiddenException();
			return this.request_repo.find({
				relations: {
					from: true,
					to: true,
				},
				where: [
					{ from: { id: user.id } },
					{ to: { id: user.id } },
				],
			});
		}

		@Post(options.cparam + "/friend(s)?/request(s)?")
		@UseGuards(SetupGuard)
		async create_request(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User,
			@Body("username", ParseUsernamePipe) target: User,
		) {
			user = user || me;
			if (user.id !== me.id)
				throw new ForbiddenException();

			if (user.id === target.id)
				throw new UnprocessableEntityException("Cannot befriend yourself");

			const user_friends = user.friends;
			if (user_friends?.find(friend => friend.id === target.id))
				throw new ForbiddenException("Already friends");

			if (await this.request_repo.findOneBy({ from: { id: user.id }, to: { id: target.id } }))
				throw new ForbiddenException("Already sent request");

			const request = await this.request_repo.findOne({
				relations: {
					from: true,
					to: true,
				},
				where: {
					from: {
						id: target.id
					},
					to: {
						id: user.id
					}
				}
			});
			if (request) {
				user.add_friend(target);
				target.add_friend(user);

				await this.request_repo.remove(request);
				[user, target] = await this.user_repo.save([user, target]);

				user.send_friend_update(Action.ADD, target);
				target.send_friend_update(Action.ADD, user);

			} else {
				const friend_request = new FriendRequest();
				friend_request.from = user;
				friend_request.to = target;

				await this.request_repo.save(friend_request);
			}
			return {};
		}

		@Delete(options.cparam + "/friend(s)?/request(s)?/:request_id")
		@UseGuards(SetupGuard)
		async delete_request(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User,
			@Param("request_id", ParseIDPipe(FriendRequest)) request: FriendRequest
		) {
			user = user || me;
			if (user.id !== me.id)
				throw new ForbiddenException();
			if (user.id !== request.from.id && user.id !== request.to.id)
				throw new NotFoundException();
			return await this.request_repo.remove(request);
		}

		@Get(`${options.cparam}/invites`)
		async invites(@Me() user: User) {
			return this.invite_repo.find({
				relations: {
					from: true,
					to: true,
				},
				where: [
					{ from: { id: user.id } },
					{ to: { id: user.id } },
				],
			});
		}
	}
	return UserControllerFactory;
}

class NullPipe implements PipeTransform {
	async transform(value: any, metadata: ArgumentMetadata) {
		return null;
	}
}

export class UserMeController extends GenericUserController("user(s)?/", { param: "me", cparam: "me", pipe: NullPipe }) { }
export class UserIDController extends GenericUserController("user(s)?/id", { param: "id", cparam: ":id", pipe: ParseIDPipe(User, { friends: true }) }) { }
export class UserUsernameController extends GenericUserController("user(s)?/", { param: "username", cparam: ":username", pipe: ParseUsernamePipe }) { }
