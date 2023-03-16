import { Controller, Get, Inject, Param, HttpStatus, Body, UseInterceptors, UploadedFile, ParseFilePipeBuilder, UseGuards, ClassSerializerInterceptor,Res, Delete, Post, PipeTransform, ArgumentMetadata, Put, ForbiddenException, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express, Response } from "express";
import { User } from "../entities/User";
import { Invite } from "../entities/Invite";
import { FriendRequest } from "../entities/FriendRequest";
import { Repository, FindManyOptions } from "typeorm";
import { HttpAuthGuard } from "../auth/auth.guard";
import { Me, ParseIDPipe, ParseUsernamePipe, UsernameDTO } from "../util";
import { randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";
import { join } from "path";
import { AVATAR_DIR, DEFAULT_AVATAR, AVATAR_EXT } from "../vars";
import { SetupGuard } from "src/guards/setup.guard";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Action, Subject } from "src/enums";
import * as gm from "gm";
import type { Achievement } from "src/entities/Achievement";
import type { AchievementView } from "src/entities/AchievementView";
import { AchievementProgress } from "src/entities/AchievementProgress";

declare module "express" {
	export interface Request {
		user?: User;
	}
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
			@Inject("ACHIEVEMENT_REPO")
			readonly achievement_repo: Repository<Achievement>,
			@Inject("ACHIEVEMENTPROGRESS_REPO")
			readonly progress_repo: Repository<AchievementProgress>,
			@Inject("ACHIEVEMENTVIEW_REPO")
			readonly view_repo: Repository<AchievementView>,
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
				await promise;
			} catch (error) {
				console.error(error);
				throw new UnprocessableEntityException("Corrupted image");
			}
			if (user.avatar_base !== DEFAULT_AVATAR) {
				await rm(user.avatar_path);
			}

			user.avatar_base = new_base;
			await this.user_repo.save(user);

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

		@Get(options.cparam + "/achievements")
		@UseGuards(SetupGuard)
		async list_achievements(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User
		) {
			user = user || me;
			const list = await this.view_repo.findBy({ user_id: user.id });
			return list;
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

		@Delete(options.cparam + "/friend(s)?/:friend")
		@UseGuards(SetupGuard)
		async unfriend(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User,
			@Param("friend", ParseIDPipe(User, { friends: true })) friend: User,
		) {
			user = user || me;
			if (user.id !== me.id) {
				throw new ForbiddenException();
			}

			user.friends = await this.user_repo.findBy({ friends: { id: user.id } }) ?? [];

			if (!user.friends.map((x) => x.id).includes(friend.id)) {
				throw new NotFoundException;
			}
		
			user.remove_friend(friend);
			friend.remove_friend(user);
		
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
				await this.request_repo.save({ from: user, to: target});
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

		@Get(`${options.cparam}/blocked`)
		async blocked(@Me() me: User) {
			const { blocked } = await this.user_repo.findOne({ where: { id: me.id }, relations: { blocked: true }});
		
			return blocked;
		}

		@Post(`${options.cparam}/block/:target`)
		async block(@Me() me: User, @Param("target", ParseIDPipe(User)) target: User) {
			me = await this.user_repo.findOne({ where: { id: me.id }, relations: { blocked: true }});

			if (me.blocked.map((user) => user.id).includes(target.id)) {
				throw new ForbiddenException("Already blocked");
			}

			await this.user_repo.save({ id: me.id, blocked: [...me.blocked, target] });

			UpdateGateway.instance.send_update({
				subject: Subject.BLOCK,
				action: Action.ADD,
				id: target.id,
				value: { id: target.id }
			}, me);

			return {};
		}
	
		@Delete(`${options.cparam}/unblock/:target`)
		async unblock(@Me() me: User, @Param("target", ParseIDPipe(User)) target: User) {
			me = await this.user_repo.findOne({ where: { id: me.id }, relations: { blocked: true }});

			if (!me.blocked.map((user) => user.id).includes(target.id)) {
				throw new ForbiddenException("Not blocked");
			}

			await this.user_repo.save({ id: me.id, blocked: me.blocked.filter((user) => user.id !== target.id) });
		
			UpdateGateway.instance.send_update({
				subject: Subject.BLOCK,
				action: Action.REMOVE,
				id: target.id,
			}, me);

			return {};
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
