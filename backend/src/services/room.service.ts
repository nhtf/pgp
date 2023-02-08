import { UpdateGateway } from "src/gateways/update.gateway";
import { Room } from "../entities/Room";
import { randomBytes } from "node:crypto";
import { User } from "../entities/User";
import { Member } from "../entities/Member";
import { Repository, FindOptionsWhere, FindOptionsRelations, FindManyOptions } from "typeorm";
import { Access } from "../enums/Access";
import { GameRoom } from "../entities/GameRoom";
import { Controller, Inject, Get, Param, HttpStatus, Post, Body, Delete, Patch, ParseEnumPipe, UseGuards, createParamDecorator, ExecutionContext, UseInterceptors, ClassSerializerInterceptor, Injectable, CanActivate, mixin, Put, Query, UsePipes, ValidationPipe, SetMetadata, ForbiddenException, NotFoundException, BadRequestException, ParseBoolPipe, UnprocessableEntityException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IsString, Length, IsOptional, IsBoolean } from "class-validator";
import { Role } from "../enums/Role";
import { Me, ParseUsernamePipe, ParseIDPipe } from "../util";
import { HttpAuthGuard } from "../auth/auth.guard";
import { RoomInvite } from "../entities/RoomInvite";
import * as argon2 from "argon2";

const ERR_ROOM_NOT_FOUND = "Room not found";
const ERR_PERM = "Insufficient permissions";

export class PasswordDTO {
	@IsString()
	@Length(1, 200)
	password: string;
}

export class CreateRoomDTO {
	@Length(3, 20)
	@IsString()
	name: string;

	@IsBoolean()
	is_private: boolean;

	@IsString()
	@Length(1, 200)//TODO length should not be checked here, an empty password might be sent with is_private on
	@IsOptional()
	password: string;
}

export interface IRoomService<T extends Room> {
	create(name?: string, is_private?: boolean, password?: string): Promise<T>;
	destroy(room: number | T): Promise<boolean>;
	add_member(room: number | T, user: number | User, role?: Role): Promise<Member>;
	edit_member(room: number | T, role: Role, member: Member | User | number): Promise<Member>;
	del_member(room: number | T, member: Member | User | number, ban?: boolean): Promise<boolean>;
}

export function getRoomService<T extends Room>(room_repo: Repository<T>, member_repo: Repository<Member>, invite_repo: Repository<RoomInvite>, user_repo: Repository<User>, type: (new () => T)) {
	class RoomService<T extends Room> implements IRoomService<T> {
		constructor(
			readonly room_repo: Repository<T>,
			readonly member_repo: Repository<Member>,
			readonly invite_repo: Repository<RoomInvite>,
			readonly user_repo: Repository<User>,
			readonly type: (new () => T),
		) {}

		async create(name?: string, is_private?: boolean, password?: string): Promise<T> {
			if (!name)
				name = randomBytes(30).toString("hex");

			if (is_private === false && await this.room_repo.findOneBy({ name: name, is_private: false} as FindOptionsWhere<T>))
				throw new ForbiddenException(`A room with the name "${name}" already exists`);

			const room = new this.type();
			room.name = name;
			room.is_private = is_private || false;
			if (!room.is_private && password)
				room.password = await argon2.hash(password);
			return this.room_repo.save(room);
		}

		async get_room(room: number | T): Promise<T | null> {
			if (typeof room === "number")
				return this.room_repo.findOne({
					relations: {
						members: {
							user: true,
						},
						banned_users: true,
					} as FindOptionsRelations<T>,
					where :{ id: room } as FindOptionsWhere<T>,
				});
			return room;
		}

		async get_room_or_fail(room: number | T): Promise<T> {
			room = await this.get_room(room);
			if (!room)
				throw new NotFoundException(ERR_ROOM_NOT_FOUND);
			return room;
		}

		async destroy(room: number | T) {
			room = await this.get_room(room);
			await this.room_repo.remove(room);
			return true;
		}

		async add_member(room: number | T, user: number | User, role?: Role): Promise<Member> {
			room = await this.get_room(room);

			if (typeof user === "number")
				user = await this.user_repo.findOneBy({ id: user });
			if (!user)
				throw new NotFoundException("User not found");

			if (await this.member_repo.findOneBy({ room: { id: room.id }, user: { id: user.id } }))
				throw new ForbiddenException("Already member of room");

			const member = new Member();
			member.role = role || Role.MEMBER;
			member.room = room;
			member.user = user;
			return this.member_repo.save(member);
		}

		async del_member(room: number | T, member: Member | User | number, ban?: boolean) {
			room = await this.get_room(room);

			if (!(member instanceof Member))
				member = await this.member_repo.findOneBy({ room: { id: room.id }, user: { id: typeof member === "number" ? member : member.id  } });
			if (!member)
				return false;
			await this.member_repo.remove(member);

			if (ban === true) {
				const user = member.user;
				//TODO make sure that banned_users is loaded, because otherwise things will really go wrong
				if (room.banned_users)
					room.banned_users.push(user);
				else
					room.banned_users = [ user ];
				await this.room_repo.save(room);
			}

			return true;
		}

		async edit_member(room: number | T, role: Role, member: Member | User | number): Promise<Member> {
			room = await this.get_room(room);

			if (!(member instanceof Member))
				member = await this.member_repo.findOneBy({ room: { id: room.id }, user: { id: typeof member === "number" ? member : member.id  } });
			if (!member)
				throw new NotFoundException("Member not found");
			member.role = role;
			return this.member_repo.save(member);
		}
	}
	return new RoomService<T>(room_repo, member_repo, invite_repo, user_repo, type);
}

export const GetMember = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();

		if (!request.member) {
			if (request.room.access === Access.PRIVATE)
				throw new NotFoundException(ERR_ROOM_NOT_FOUND);
			else
				throw new ForbiddenException(ERR_PERM);
		}
	
		return request.member;
	}
);

export const GetRoom = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		const room = ctx.switchToHttp().getRequest().room;

		if (!room) {
			throw new NotFoundException(ERR_ROOM_NOT_FOUND);
		}
	
		return room;
	}
);

const ROLE_KEY = "PGP_ROLES";
@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const role = this.reflector.get<Role>(ROLE_KEY, context.getHandler());
		if (role === undefined)
			return true;
		const request = context.switchToHttp().getRequest();
		const room = request.room;
		const member = request.member;
		if (!room || (!member && room.is_private))
			throw new NotFoundException(ERR_ROOM_NOT_FOUND);
		else if (member?.role >= role)
			return true;
		else
			throw new ForbiddenException(ERR_PERM);
	}
}

export const RequiredRole = (role: Role) => SetMetadata(ROLE_KEY, role);

export function GenericRoomController<T extends Room, C extends CreateRoomDTO = CreateRoomDTO>(type: (new () => T), route?: string, c?: (new () => C)) {
	@UseGuards(HttpAuthGuard, RolesGuard)
	@UseInterceptors(ClassSerializerInterceptor)
	@Controller(route || type.name.toString().toLowerCase())
	class RoomControllerFactory {
		constructor(
			@Inject(type.name.toString().toUpperCase() + "_REPO")
			readonly room_repo: Repository<T>,
			@Inject("MEMBER_REPO")
			readonly member_repo: Repository<Member>,
			@Inject("ROOMINVITE_REPO")
			readonly invite_repo: Repository<RoomInvite>,
			@Inject(type.name.toString().toUpperCase() + "_PGPSERVICE")
			readonly service: IRoomService<T>,
			readonly update_service: UpdateGateway,
		) {
		}

		async get_member(user: User, room: Room): Promise<Member | null> {
			return this.member_repo.findOneBy({ user: { id: user.id }, room: { id: room.id } });
		}

		@Get("")
		async get_visible(@Me() user: User, @Query("member", ParseBoolPipe) member?: boolean) {
			let rooms: T[];

			if (member === undefined) {
				return await this.room_repo.find({
					relations: {
						members: {
							user: true,
						},
					} as FindOptionsRelations<T>,
					where: [
						{ members: { user: { id: user.id } } },
						{ is_private: false }
					] as FindOptionsWhere<T>[],
				});
			}
		
			if (member) {
				//TODO fix this
				rooms = await this.room_repo.createQueryBuilder("room")
					    .where((qb) => {
					   	 const subQuery = qb
							.subQuery()
							.select("\"member\".\"roomId\"")
							.select("\"member\".\"userId\"")
							.from(Member, "member")
							.where("\"roomId\" = \"room\".\"id\"")
							.andWhere("\"userId\" = :user_id")
							.getQuery();
							return "EXISTS (" + subQuery + ")";
					    })
						.leftJoinAndSelect("room.members", "member")
						.leftJoinAndSelect("member.user", "user")
					    .setParameter("user_id", user.id)
					    .getMany();
			} else {
				//TODO also list private rooms for which you have an invite?
				rooms = await this.room_repo.createQueryBuilder("room")
					    .where("\"room\".\"is_private\" = false")
					    .andWhere((qb) => {
					   	 const subQuery = qb
							.subQuery()
							.select("\"member\".\"roomId\"")
							.select("\"member\".\"userId\"")
							.from(Member, "member")
							.where("\"roomId\" = \"room\".\"id\"")
							.andWhere("\"userId\" = :user_id")
							.getQuery();
							return "NOT EXISTS (" + subQuery + ")";
					    })
						.leftJoinAndSelect("room.members", "member")
						.leftJoinAndSelect("member.user", "user")
					    .setParameter("user_id", user.id)
					    .getMany();
			}

			return rooms;
		}

		// TODO: remove
		@Get("all")
		async all() {
			return this.room_repo.find({
				relations: {
					members: {
						user: true,
					},
				},
			} as FindManyOptions<T>);
		}

		@Post()
		@UsePipes(new ValidationPipe({ expectedType: c || CreateRoomDTO }))
		async create_room(@Me() user: User, @Body() dto: C) {
			const name = dto.name.trim();
			const room = await this.service.create(name, dto.is_private, dto.password);

			await this.service.add_member(room, user, Role.OWNER);
			await this.setup_room(room, dto);
			await this.room_repo.save(room);//TODO only save one time
		
			return room;
		}

		async setup_room(room: T, dto: C) {

		}

		@Get("id/:id")
		@RequiredRole(Role.MEMBER)
		async get_room(@GetRoom() room: T) {
			return room;
		}

		@Patch("id/:id")
		@RequiredRole(Role.OWNER)
		async edit_room(
			@GetRoom() room: T,
			@Body() dto: PasswordDTO,
		) {
			if (room.is_private)
				throw new UnprocessableEntityException("A private room cannot have a password");
			room.password = await argon2.hash(dto.password);
			await this.room_repo.save(room);
			return {};
		}

		@Get("id/:id/role")
		@RequiredRole(Role.MEMBER)
		async role(@Me() me: User, @GetRoom() room: T) {
			return room.members.find((member) => member.user.id === me.id).role;
		}

		@Post("id/:id/member(s)?")
		async join(@Me() me: User, @GetRoom() room: T, @Body("password") password?: string) {
			const invites = await this.invite_repo.findBy({ to: { id: me.id } });

			if ((!invites || invites.length == 0) && room.access == Access.PRIVATE) {
				throw new NotFoundException("Not found");
			}

			if (room.banned_users?.find(current => current.id === room.id))
				throw new ForbiddenException("You have been banned from this channel"); //TODO should this give "not found" for private rooms?
				// M: no, ban implies they knew of this room

			if (!invites || invites.length === 0) {
				if (room.access === Access.PROTECTED) {
					if (!password) {
						throw new BadRequestException("Missing password");
					}
					
					if (!await argon2.verify(room.password, password)) {
						throw new ForbiddenException("Incorrect password");
					}
				}
			}
			await this.service.add_member(room, me);
			await this.invite_repo.remove(invites);

			return {};
		}

		@Delete("id/:id/leave")
		async leave(@GetRoom() room: T, @GetMember() member: Member) {
			if (member.role === Role.OWNER) {
				if (room.members.length > 1) {
					throw new ForbiddenException("You must transfer ownership before leaving a room as owner");
				}
			
				return await this.service.destroy(room);
			}
		
			return await this.service.del_member(room, member, false);
		}


		@Get("id/:id/member(s)?")
		@RequiredRole(Role.MEMBER)
		async list_members(@GetRoom() room: T) {
			return this.member_repo.find({
				relations: {
					user: true,
				},
				where: {
					room: {
						id: room.id,
					},
				},
			});
		}


		@Delete("id/:id/member(s)?/:target")
		@RequiredRole(Role.MEMBER)
		async remove_member(
			@GetRoom() room: T,
			@GetMember() member: Member,
			@Param("target", ParseIDPipe(Member)) target: Member,
			@Body("ban", ParseBoolPipe) ban: boolean,
		) {
		
			if (member.room.id !== room.id) {
				throw new BadRequestException("Target not a member of this room");
			} 
		
			if (member.id !== target.id && target.role >= member.role) {
				console.log(member.role + " " + target.role);
				throw new ForbiddenException(ERR_PERM);
			}
			if (ban === true && member.role < Role.ADMIN)
				throw new ForbiddenException(ERR_PERM);

			if (target.role === Role.OWNER) {
				if (room.members.length > 1) {
					throw new ForbiddenException("You must transfer ownership before leaving a room as owner");
				}
			
				return await this.service.destroy(room);
			}

			//TODO fix bans
			return await this.service.del_member(room, target, ban === true);
		}

		@Delete("id/:id")
		@RequiredRole(Role.OWNER)
		async delete_room(@GetMember() member: Member, @GetRoom() room: T) {
			return await this.room_repo.remove(room);
		}

		@Patch("id/:id/member(s)?/:target")
		@RequiredRole(Role.MEMBER)
		async edit_member(
			@GetMember() member: Member,
			@GetRoom() room: T,
			@Param("target", ParseIDPipe(Member, { room: true })) target: Member,
			@Body("role", new ParseEnumPipe(Role)) role: Role
		) {
			console.log(typeof role);
			if (member.room.id !== room.id) {
				throw new BadRequestException("Target not a member of this room");
			} 
		
			if (target.role >= member.role || role >= member.role) {
				throw new ForbiddenException(ERR_PERM);
			}
		
			target.role = role;
		
			if (role === Role.OWNER) {
				member.role = Role.ADMIN;
			}
		
			return await this.member_repo.save([member, target]);
		}

		@Get("id/:id/invite(s)?")
		@RequiredRole(Role.MEMBER)
		async room_invites(@GetRoom() room: T) {
			return this.invite_repo.find({
				relations: {
					from: true,
					to: true,
				},
				where: {
					room: {
						id: room.id,
					},
				},
			});
		}

		@Post("id/:id/invite(s)?")
		@RequiredRole(Role.ADMIN)
		async create_invite(
			@Me() me: User,
			@GetMember() member: Member,
			@GetRoom() room: T,
			@Body("username", ParseUsernamePipe) target: User
		) {
			if (await this.get_member(target, room))
				throw new ForbiddenException("User already member of this room");

			if (await this.invite_repo.findOneBy({ room: { id: room.id }, from: { id: me.id }, to: { id: target.id } }))
				throw new ForbiddenException("Already invited this user");

			const invite = new RoomInvite;

			invite.from = me;
			invite.to = target;
			invite.room = room;

			return await this.invite_repo.save(invite);
		}

		@Delete("id/:id/invite(s)?/:invite_id")
		async delete_invite(
			@Me() me: User,
			@Param("id", ParseIDPipe(Room)) room: Room,
			@Param("invite_id", ParseIDPipe(RoomInvite, { room: true, from: true, to: true })) invite: RoomInvite,
		) {
			if (invite.room.id != room.id)
				throw new NotFoundException("Not found");
			if (invite.from.id != me.id && invite.to.id != me.id) {
				const member = await this.member_repo.findOneBy({ user: { id: me.id } });
				if (!member && room.access == Access.PRIVATE)
					throw new NotFoundException("Not found");
				else if (!member || member.role < Role.ADMIN)
					throw new ForbiddenException(ERR_PERM);
			}
			await this.invite_repo.remove(invite);
		
			return {};
			//TODO check if invite is properly removed from Room as well
		}

		@Get("id/:id/ban(s)?")
		@RequiredRole(Role.ADMIN)
		async list_bans(
			@GetRoom() room: T
		) {
			console.log(room.banned_users);
			return room.banned_users;
		}
	}
	return RoomControllerFactory;
}

export class TestController extends GenericRoomController(GameRoom) {
}
