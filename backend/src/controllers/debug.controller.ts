import {
	Controller,
	Inject,
	HttpException,
	HttpStatus,
	Req,
	Get,
	Query,
} from "@nestjs/common";
import {
	Length,
	IsString,
	IsOptional,
	IsInt,
	IsEnum,
	IsNumberString,
} from "class-validator";
import { User } from "../entities/User";
import { GameState } from "src/entities/GameState"
import { AuthLevel, Role } from "src/enums";
import { Repository, IsNull, Not } from "typeorm";
import { Request } from "express";
import { SessionService } from "src/services/session.service"
import { ParseIDPipe } from "../util";
import { Room } from "src/entities/Room";
import { GameRoom } from "src/entities/GameRoom";
import { Member } from "src/entities/Member";
import { DEFAULT_AVATAR } from "../vars";
import { Invite } from "src/entities/Invite";
import { Achievement } from "src/entities/Achievement";
import { Objective } from "src/entities/Objective";
import { Message } from "src/entities/Message";
import { Player } from "src/entities/Player";
import { AchievementProgress } from "src/entities/AchievementProgress";
import { UserService } from "src/services/user.service";

class UserDTO {
	@IsNumberString()
	@IsOptional()
	id: string

	@IsString()
	@Length(1, 20)
	@IsOptional()
	username: string;

	@IsInt()
	@IsOptional()
	oauth_id?: number;

	@IsString()
	@IsOptional()
	secret?: string;

	@IsString()
	@IsOptional()
	avatar_base?: string;

	@IsEnum(AuthLevel)
	@IsOptional()
	auth_req?: string;
}

// TODO THIS MUST BE DISABLED BEFORE TURNING IN!
@Controller("debug")
export class DebugController {
	constructor(
		private readonly sessionUtils: SessionService,
		@Inject("USER_REPO")
		private readonly userRepo: Repository<User>,
		@Inject("ROOM_REPO")
		private readonly roomRepo: Repository<Room>,
		@Inject("MEMBER_REPO")
		private readonly memberRepo: Repository<Member>,
		@Inject("INVITE_REPO")
		private readonly inviteRepo: Repository<Invite>,
		@Inject("MESSAGE_REPO")
		private readonly messageRepo: Repository<Message>,
		@Inject("GAMESTATE_REPO")
		private readonly gamestateRepo: Repository<GameState>,
		@Inject("PLAYER_REPO")
		private readonly playerRepo: Repository<Player>,
		@Inject("ACHIEVEMENT_REPO")
		private readonly achievementRepo: Repository<Achievement>,
		@Inject("OBJECTIVE_REPO")
		private readonly objectiveRepo: Repository<Objective>,
		@Inject("ACHIEVEMENTPROGRESS_REPO")
		private readonly progressRepo: Repository<AchievementProgress>,
		private readonly userService: UserService,
	) {}

	@Get()
	async upTop() {
		return this.userRepo.createQueryBuilder()
			.where("true")
			.getMany();
	}

	@Get("useradd")
	async useradd(@Query() dto: UserDTO) {
		// const exists = dto.username ?
		// 	(await this.userRepo.findOneBy({ username: dto.username })) !== null : false;
		// if (exists)
		// 	throw new HttpException(
		// 		"an user with that username already exists",
		// 		HttpStatus.BAD_REQUEST,
		// 	);

		const user = new User();
		user.username = dto.username;
		user.oauth_id = dto.oauth_id ?? -1;
		user.secret = dto.secret;
		user.avatar_base = dto.avatar_base ?? DEFAULT_AVATAR;
		user.auth_req = dto.secret ? AuthLevel.TWOFA : AuthLevel.OAuth;
	
		try {
			await this.userRepo.save(user);
		} catch (err) {
			if (err.code == 23505) {
				throw new HttpException("A user with this name already exists", HttpStatus.FORBIDDEN);
			}
			throw new HttpException(err.message, HttpStatus.BAD_GATEWAY);
		}
		return user;
	}

	@Get("usermod")
	async usermod(@Query() dto: UserDTO) {
		const user = await this.userRepo.findOneBy({ username: dto.username });
		if (!user)
			throw new HttpException("user does not exist", HttpStatus.NOT_FOUND);
		user.oauth_id = dto.oauth_id ?? user.oauth_id;
		user.secret = dto.secret ?? user.secret;
		user.avatar_base = dto.avatar_base ?? user.avatar_base;
		user.auth_req = dto.auth_req ? AuthLevel[dto.auth_req] : user.auth_req;
		await this.userRepo.save(user);
		return user;
	}

	@Get("userdel")
	async userdel(@Query() dto: UserDTO) {
		const user = await this.userRepo.findOneBy(dto.username ? { username: dto.username } : { id: Number(dto.id) });
		if (!user)
			throw new HttpException("user does not exist", HttpStatus.NOT_FOUND);
		await this.userService.remove(user);
		/*
		await this.userRepo.remove(user);*/
		return "deleted user";
	}

	@Get("su")
	async su(@Req() request: Request, @Query() dto: UserDTO){
		const res = await this.sessionUtils.regenerate_session_req(request);
	
		if (!res) {
			throw new HttpException("could not regenerate session", HttpStatus.INTERNAL_SERVER_ERROR);
		}

		const user = await this.userRepo.findOneBy({ username: dto.username });
	
		if (!user) {
			throw new HttpException("user does not exist", HttpStatus.NOT_FOUND);
		}
	
		request.session.user_id = user.id;
		request.session.auth_level = user.auth_req;
	
		return user;
	}

	@Get("id")
	async id(@Query() dto: UserDTO) {
		const user = await this.userRepo.findOneBy({ username: dto.username });
		if (!user)
			throw new HttpException("user does not exist", HttpStatus.NOT_FOUND);
		return user;
	}

	@Get("user(s)?")
	async lsuser() {
		return this.userRepo.find({
			relations: {
				banned_rooms: true,
				friends: true,
				blocked: true,
			},			
		});
	}

	@Get("user(s)?/friend(s)?")
	async friends() {
		return this.userRepo.find({
			relations: {
				friends: true,
			},			
		});
	}

	@Get("meanGirls")
	async unfriendAll() {
		let users = await this.userRepo.find({
			relations: {
				friends: true,
			},			
		});

		users.forEach((user) => {
			user.friends = [];
		});

		return await this.userRepo.save(users);
	}

	@Get("room(s)?")
	async rooms() {
		return this.roomRepo.find({
			relations: {
				members: {
					user: true,
				},
				banned_users: true,
			}
		});
	}

	@Get("room(s)?/delete")
	async deleteRoom(@Query("id") id: string) {
		return await this.roomRepo.delete(Number(id));
	}

	@Get("members")
	async members() {
		return this.memberRepo.find({
			relations: {
				user: true,
				room: true,
			},
		});
	}

	@Get("invites")
	async invites() {
		return this.inviteRepo.find();
	}

	@Get("invite(s)?/delete")
	async deleteInvite(@Query("id") id: string) {
		return await this.inviteRepo.delete(Number(id));
	}

	@Get("room/setOwner")
	async setOwner(@Query("id") id: string) {
		return this.memberRepo.save({ id: Number(id), role: Role.OWNER });
	}

	@Get("room/demote")
	async demote(@Query("id") id: string) {
		const member = await this.memberRepo.findOneBy({ id: Number(id) });
	
		if (member.role > 0) {
			member.role -= 1;
		}

		return this.memberRepo.save(member);
	}

	@Get("test")
	async test() {
		return this.roomRepo.find({ relations: { invites: true }})
	}

	@Get("messages")
	async messages() {
		return await this.messageRepo.find({
			relations: {
				user: true,
				member: true,
				room: true,
			}
		});
	}

	@Get("message(s)?/delete")
	async deleteMessage(@Query("id") id: string) {
		return await this.messageRepo.delete(Number(id));
	}

	@Get("room(s)?/liberate")
	async liberate(@Query("id") id: string) {
		return this.roomRepo.save({ id: Number(id), banned_users: [] });
	}

	@Get("history")
	async gameStates() {
		return await this.gamestateRepo.find({
			relations: {
				teams: true,
			}
		});
	}

	@Get("ach(s)?")
	async get_achievements() {
		return this.achievementRepo.find({ relations: { objectives: true } });
	}

	@Get("obj(s)?")
	async get_objectives() {
		return this.objectiveRepo.find();
	}

	@Get("addach")
	async create_achievement(
		@Query("name") name?: string,
		@Query("max") max?: number,
		@Query("desc") desc?: string,
		@Query("img") image?: string,
	)
	{
		// const achievement = new Achievement();

		// achievement.name = name;
		// achievement.max = max;
		// achievement.image = image;

		/*
		if (parent && parent != "") {
			const id = Number(parent);
			const up = isNaN(id) ? await this.achievementRepo.findOneBy({ name: parent}) : await this.achievementRepo.findOneBy({ id });

			if (!up)
				throw new NotFoundException(`Parent "${parent}" not found`);
			achievement.parent = up;

		}*/
		this.achievementRepo.save({ name, max, image });
	}

	@Get("addobj")
	async create_objective(
		@Query("threshold") threshold: number,
		@Query("ach", ParseIDPipe(Achievement)) achievement: Achievement
	) {
		return this.objectiveRepo.save({ threshold, achievement } as Objective);
	}

	@Get("unlock")
	async unlock(@Query("id", ParseIDPipe(GameRoom)) room: GameRoom) {
		await this.gamestateRepo.save({ id: room.state.id, teamsLocked: false });
	}

	@Get("room(s)?/wipe")
	async clearRooms() {
		return this.roomRepo.remove(await this.roomRepo.find());
	}

	@Get("bot(s)?")
	async bots() {
		return this.userRepo.findBy({ api_secret: Not(IsNull()) });
	}

	@Get("emptyPlayer")
	async emptyPlayer() {
		return this.playerRepo.remove( await this.playerRepo.findBy({ user: IsNull() }));
	}

	@Get("clearProgress")
	async clearProgress() {
		const all = await this.progressRepo.find();

		all.forEach((progress) => {
			progress.progress = 0;
		});

		await this.progressRepo.save(all);
		
	}

	@Get("room(s)?/newest")
	async newestRoom() {
		const all = await this.roomRepo.find();

		all.sort((first, second) => first.id - second.id);
	
		return all[all.length - 1];
	}

	@Get("member(s)?/homeless")
	async noRoom() {
		const members = await this.memberRepo.findBy({ room: null });

		await this.memberRepo.remove(members);
	}
}
