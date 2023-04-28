import type { Achievement } from "src/entities/Achievement";
import type { AchievementView } from "src/entities/AchievementView";
import {
	Controller,
	Get,
	Inject,
	Param,
	HttpStatus,
	Body,
	UseInterceptors,
	UploadedFile,
	ParseFilePipeBuilder,
	UseGuards,
	ClassSerializerInterceptor,
	Res,
	Delete,
	Post,
	PipeTransform,
	ArgumentMetadata,
	Put,
	ForbiddenException,
	NotFoundException,
	UnprocessableEntityException,
	HttpCode,
	Query
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express, Response } from "express";
import { User } from "../entities/User";
import { Invite } from "../entities/Invite";
import { FriendRequest } from "../entities/FriendRequest";
import { Repository } from "typeorm";
import { HttpAuthGuard } from "../auth/auth.guard";
import { Me, ParseIDPipe, ParseUsernamePipe, UsernameDTO } from "../util";
import { randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";
import { join } from "path";
import { AVATAR_DIR, DEFAULT_AVATAR, AVATAR_EXT, FUZZY_THRESHOLD } from "../vars";
import { SetupGuard } from "src/guards/setup.guard";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Action, Subject } from "src/enums";
import { AchievementProgress } from "src/entities/AchievementProgress";
import { instanceToPlain } from "class-transformer";
import { AchievementService } from "src/services/achievement.service";
import { FRIEND_COUNT_ACHIEVEMENT, AVATAR_ACHIEVEMENT } from "src/achievements";
import { IsBooleanString, IsOptional, IsString } from "class-validator";
import { UserService } from "src/services/user.service"
import * as gm from "gm";

declare module "express" {
	export interface Request {
		user?: User;
	}
}

class SearchQuery {
	@IsBooleanString()
	@IsOptional()
	human: string;

	@IsString()
	@IsOptional()
	username: string;
}

export function GenericUserController(
	route: string,
	options: { param: string; cparam: string; pipe: any }
) {
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
			readonly achievement_service: AchievementService,
			readonly user_service: UserService,
		) { }

		async invite(user: User, target: User) {
			const invite = new FriendRequest;

			invite.from = user;
			invite.to = target;

			await this.request_repo.save(invite);
		}

		async befriend(user: User, target: User, request: Invite) {
			await this.user_service.permute(user, target, async (first: User, second: User) => {
				first.add_friend(second);
				first = await this.user_repo.save(first);
				first.send_friend_update(Action.INSERT, second);
			
				await this.achievement_service.inc_progress(FRIEND_COUNT_ACHIEVEMENT, first, 1);
			});
		
			await this.request_repo.remove(request);
		}

		@Get()
		@UseGuards(SetupGuard)
		async list_all(@Query() filters: SearchQuery) {
			const query = this.user_repo.createQueryBuilder("user");

			if (filters.human === "true")
				query.andWhere("user.api_secret IS NULL");
			if (filters.username)
				query.andWhere("similarity(user.username, :username) > :threshold", { username: filters.username, threshold: FUZZY_THRESHOLD })

			return query.getMany();
		}

		@Get(options.cparam)
		async get_user(
			@Me() me: User,
			@Param(options.param, options.pipe) user?: User,
		) {
			user = user ?? me;

			user.achievements = await this.get_achievements(user);

			if (user.id === me.id) {
				return { ...instanceToPlain(user), auth_req: user.auth_req };
			}

			return user;
		}

		@Put(options.cparam + "/username")
		async set_username(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User,
			@Body() dto: UsernameDTO
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
			@Res() response: Response
		) {
			user = user || me;
			response.redirect(user.avatar);
		}

		@Put(options.cparam + "/avatar")
		@UseInterceptors(FileInterceptor("avatar"))
		@UseGuards(SetupGuard)
		@HttpCode(HttpStatus.NO_CONTENT)
		async set_avatar(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User,
			@UploadedFile(
				new ParseFilePipeBuilder()
					.addMaxSizeValidator({
						maxSize: 10485760,
					})
					.build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
			)
			uploaded_file: Express.Multer.File
		) {
			user = user || me;
			if (user.id !== me.id) throw new ForbiddenException();

			let new_base = "";
			do {
				new_base = user.id + randomBytes(20).toString("hex");
			} while (new_base === user.avatar_base);

			const promise = new Promise((resolve, reject) => {
				gm.subClass({ imageMagick: true })(uploaded_file.buffer)
					.resize(256, 256, "!")
					.write(join(AVATAR_DIR, new_base + AVATAR_EXT), (error) => {
						if (error) reject(error);
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
				try {
					await rm(user.avatar_path);
				} catch {}
			} 

			user.avatar_base = new_base;
			await this.user_repo.save(user);

			// avatar is a getter and won't trigger the subscriber
			UpdateGateway.instance.send_update({
				subject: Subject.USER,
				action: Action.UPDATE,
				id: user.id,
				value: { avatar: user.avatar },
			});

			await this.achievement_service.inc_progress(AVATAR_ACHIEVEMENT, user, 1);
		}

		@Get(options.cparam + "/auth_req")
		@UseGuards(SetupGuard)
		async get_auth_req(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User
		) {
			user = user || me;
			if (user.id !== me.id) {
				throw new ForbiddenException();
			}
			return user.auth_req;
		}

		async get_achievements(user: User): Promise<any[]> {
			const list = await this.view_repo.findBy({ user_id: user.id });
			const map = new Map();

			for (const elem of list) {
				if (!map.has(elem.id)) {
					map.set(elem.id, {
						id: elem.id,
						name: elem.name,
						progress: elem.progress,
						image: elem.image,
						objectives: [],
					});
				}
				map.get(elem.id).objectives.push({
					threshold: elem.threshold,
					color: elem.color,
					description: elem.description,
					name: elem.objective_name,
				});
			}
			return Array.from(map.values());
		}

		@Get(options.cparam + "/achievements")
		@UseGuards(SetupGuard)
		async list_achievements(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User
		) {
			user = user || me;

			return this.view_repo.findBy({ user_id: user.id });
		}

		@Get(options.cparam + "/friend(s)?")
		@UseGuards(SetupGuard)
		async list_friends(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User
		) {
			user = user || me;
			if (user.id !== me.id) throw new ForbiddenException();
			return this.user_repo.findBy({
				friends: {
					id: user.id,
				},
			});
		}

		@Delete(options.cparam + "/friend(s)?")
		@UseGuards(SetupGuard)
		@HttpCode(HttpStatus.NO_CONTENT)
		async unfriend(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User,
			@Body("friend", ParseIDPipe(User, { friends: true })) friend: User
		) {
			user = user || me;
			if (user.id !== me.id) {
				throw new ForbiddenException();
			}

			user.friends = await this.user_repo.findBy({ friends: { id: user.id } });

			if (!user.friends.some((user) => user.id === friend.id)) {
				throw new NotFoundException("User not found");
			}

			await this.user_service.permute(user, friend, async (first: User, second: User) => {
				first.remove_friend(second);
				first = await this.user_repo.save(first);
				first.send_friend_update(Action.REMOVE, second);
			
				await this.achievement_service.inc_progress(FRIEND_COUNT_ACHIEVEMENT, first, -1);
			});
		}

		@Get(options.cparam + "/friend(s)?/request(s)?")
		@UseGuards(SetupGuard)
		async list_requests(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User
		) {
			user = user || me;
			if (user.id !== me.id) {
				throw new ForbiddenException()
			};

			return this.request_repo.find({
				relations: {
					from: true,
					to: true,
				},
				where: [{ from: { id: user.id } }, { to: { id: user.id } }],
			});
		}

		@Post(options.cparam + "/friend(s)?")
		@UseGuards(SetupGuard)
		@HttpCode(HttpStatus.NO_CONTENT)
		async create_request(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User,
			@Body("username", ParseUsernamePipe({ friends: true })) target: User
		) {
			user = user || me;
			if (user.id !== me.id) {
				throw new ForbiddenException();
			};
		
			user.friends = await this.user_repo.findBy({ friends: { id: user.id } });

			if (user.id === target.id) {
				throw new UnprocessableEntityException("Cannot befriend yourself");
			}

			if (target.friends.find((friend) => friend.id === user.id)) {
				throw new ForbiddenException("Already friends");
			}

			if (await this.request_repo.findOneBy({ from: { id: user.id }, to: { id: target.id } })) {
				throw new ForbiddenException("Already sent request");
			}

			const request = await this.request_repo.findOneBy({	from: { id: target.id }, to: { id: user.id } });

			if (request) {
				await this.befriend(user, target, request);
			} else {
				await this.invite(user, target);
			}
		}

		@Delete(options.cparam + "/friend(s)?/request(s)?/:request_id")
		@UseGuards(SetupGuard)
		@HttpCode(HttpStatus.NO_CONTENT)
		async delete_request(
			@Me() me: User,
			@Param(options.param, options.pipe) user: User,
			@Param("request_id", ParseIDPipe(FriendRequest)) request: FriendRequest
		) {
			user = user || me;
			if (user.id !== me.id) {
				throw new ForbiddenException()
			};

			if (user.id !== request.from.id && user.id !== request.to.id)
				throw new NotFoundException("Request not found");

			await this.request_repo.remove(request);
		}

		@Get(`${options.cparam}/invites`)
		async invites(@Me() user: User) {
			return this.invite_repo.find({
				where: [{ from: { id: user.id } }, { to: { id: user.id } }],
			});
		}

		@Get(`${options.cparam}/blocked`)
		async blocked(@Me() me: User) {
			const user = await this.user_repo.findOne({
				where: { id: me.id },
				relations: { blocked: true },
			});

			return user?.blocked || [];
		}

		@Post(`${options.cparam}/blocked`)
		@HttpCode(HttpStatus.NO_CONTENT)
		async block(@Me() me: User, @Body("id", ParseIDPipe(User)) target: User) {
			if (me.id === target.id) {
				throw new ForbiddenException("Can't block yourself");
			}
		
			const user = await this.user_repo.findOne({	where: { id: me.id }, relations: { blocked: true } });
			if (user == undefined)
				throw new NotFoundException("User not found");

			if (user.blocked.some(({ id }) => id === target.id)) {
				throw new ForbiddenException("Already blocked");
			}

			await this.user_repo.save({	id: user.id, blocked: [...user.blocked, target] });

			UpdateGateway.instance.send_update({
				subject: Subject.BLOCK,
				action: Action.INSERT,
				id: target.id,
				value: { id: target.id },
			}, user);
		}

		@Delete(`${options.cparam}/blocked`)
		@HttpCode(HttpStatus.NO_CONTENT)
		async unblock(@Me() me: User, @Body("id", ParseIDPipe(User)) target: User, @Res() response: Response) {
			response.redirect(`blocked/${target.id}`);
		}

		@Delete(`${options.cparam}/blocked/:target`)
		@HttpCode(HttpStatus.NO_CONTENT)
		async unblock_new(@Me() me: User, @Param("target", ParseIDPipe(User)) target: User) {
			const user = await this.user_repo.findOne({	where: { id: me.id }, relations: { blocked: true } });
			if (user == undefined)
				throw new NotFoundException("User not found");

			if (!user.blocked.some(({ id }) => id === target.id)) {
				throw new ForbiddenException("Not blocked");
			}

			await this.user_repo.save({	id: user.id,
				blocked: user.blocked.filter((user) => user.id !== target.id),
			});

			UpdateGateway.instance.send_update({
				subject: Subject.BLOCK,
				action: Action.REMOVE,
				id: target.id,
			}, user);
		}
	}
	return UserControllerFactory;
}

class NullPipe implements PipeTransform {
	async transform(_value: any, _metadata: ArgumentMetadata) {
		return null;
	}
}

export class UserMeController extends GenericUserController("user(s)?", {
	param: "me",
	cparam: "/me",
	pipe: NullPipe,
}) { }
export class UserIDController extends GenericUserController("user(s)?/id", {
	param: "id",
	cparam: "/:id",
	pipe: ParseIDPipe(User),
}) { }
export class UserUsernameController extends GenericUserController("user(s)?", {
	param: "username",
	cparam: "/:username",
	pipe: ParseUsernamePipe(),
}) { }
