import { Room } from "../entities/Room";
import { randomBytes } from "node:crypto";
import { User } from "../entities/User";
import { Member } from "../entities/Member";
import { Repository, FindOptionsWhere, FindOptionsRelations, Not, In, ArrayContains } from "typeorm";
import { Access } from "../enums/Access";
import { GameRoom } from "../entities/GameRoom";
import { Controller, Inject, Get, Param, HttpException, HttpStatus, Post, Body, Delete, ParseBoolPipe, Patch, ParseEnumPipe, UseGuards, createParamDecorator, ExecutionContext, UseInterceptors, ClassSerializerInterceptor, Injectable, CanActivate, mixin, Put, Query } from "@nestjs/common";
import { IsString, Length, IsOptional, IsBoolean } from "class-validator";
import { Role } from "../enums/Role";
import { Me, ParseUsernamePipe, ParseIDPipe } from "../util";
import { HttpAuthGuard } from "../auth/auth.guard";
import { Observable } from "rxjs";
import { RoomInvite } from "../entities/RoomInvite";
import * as argon2 from "argon2";

class CreateRoomDTO {
	@Length(3, 20)
	@IsString()
	name: string;

	@IsBoolean()
	is_private: boolean;

	@IsString()
	@Length(1, 200)
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
				throw new HttpException(`a room with the name "${name}" already exists`, HttpStatus.FORBIDDEN);

			const room = new this.type();
			room.name = name;
			room.is_private = is_private || false;
			if (!room.is_private && password)
				room.password = await argon2.hash(password);
			return this.room_repo.save(room);
		}

		async get_room(room: number | T): Promise<T | null> {
			if (typeof room === "number")
				return this.room_repo.findOneBy({ id: room } as FindOptionsWhere<T>);
			return room;
		}

		async get_room_or_fail(room: number | T): Promise<T> {
			room = await this.get_room(room);
			if (!room)
				throw new HttpException("room not found", HttpStatus.NOT_FOUND);
			return room;
		}

		/*
		async get_member(room: number | T, member?: Member, user?: number | string | User) {
			room = await get_room(room);
			if (!member && !user)
				return null;
			if (member)
				return member;
			if (typeof user === "number")
				return this.member_repo.findOneBy({ room: { id: room.id }, user: { id: user } });
		}
		*/
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
				throw new HttpException("user not found", HttpStatus.NOT_FOUND);

			if (await this.member_repo.findOneBy({ room: { id: room.id }, user: { id: user.id } }))
				throw new HttpException("already member of room", HttpStatus.FORBIDDEN);

			const member = new Member();
			member.role = role || Role.MEMBER;
			member.room = Promise.resolve(room);
			member.user = Promise.resolve(user);
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
				const user = await member.user;
				const banned_rooms = await user.banned_rooms;
				if (banned_rooms)
					banned_rooms.push(room);
				else
					user.banned_rooms = Promise.resolve([room]);
				await this.user_repo.save(user);
			}

			return true;
		}

		async edit_member(room: number | T, role: Role, member: Member | User | number): Promise<Member> {
			room = await this.get_room(room);

			if (!(member instanceof Member))
				member = await this.member_repo.findOneBy({ room: { id: room.id }, user: { id: typeof member === "number" ? member : member.id  } });
			if (!member)
				throw new HttpException("member not found", HttpStatus.NOT_FOUND);
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
				throw new HttpException("not found", HttpStatus.NOT_FOUND);
			else
				throw new HttpException("insufficient permissions", HttpStatus.FORBIDDEN);
		}
	
		return request.member;
	}
);

export const GetRoom = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		return ctx.switchToHttp().getRequest().room;
	}
);

export const RoleGuard = (role: Role) => {
	class RoleGuardMixin implements CanActivate {
		canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
			const member = context.switchToHttp().getRequest().member;

			return member && member.role >= role;
		}
	}
	return mixin(RoleGuardMixin);
}

export function GenericRoomController<T extends Room>(type: (new () => T), route?: string) {
	@UseGuards(HttpAuthGuard)
	@UseInterceptors(ClassSerializerInterceptor)
	@Controller(route || type.name.toString().toLowerCase())
	class RoomControllerFactory {
		constructor(
			@Inject(type.name.toString().toUpperCase() + "_REPO") readonly room_repo: Repository<T>,
			@Inject("MEMBER_REPO") readonly member_repo: Repository<Member>,
			@Inject("ROOMINVITE_REPO") readonly invite_repo: Repository<RoomInvite>,
			@Inject(type.name.toString().toUpperCase() + "_SERVICE") readonly service: IRoomService<T>,
		) {
		}

		async get_member(user: User, room: Room): Promise<Member | null> {
			return this.member_repo.findOneBy({ user: { id: user.id }, room: { id: room.id } });
		}

		async get_member_or_fail(user: User, room: Room): Promise<Member> {
			const member = await this.get_member(user, room);

			if (!member) {
				if (room.access === Access.PRIVATE)
					throw new HttpException("not found", HttpStatus.NOT_FOUND);
				else
					throw new HttpException("insufficient permissions", HttpStatus.FORBIDDEN);
			}

			return member;
		}

		@Get("")
		async get_visible(@Me() user: User, @Query("member") member?: string) {
			const options: FindOptionsWhere<T>[] = [];
			//const options = [{ members: { user: { id: Not(user.id) } } } as FindOptionsWhere<T>];

			console.log(member);
			if (member === undefined) {
				console.log("a");
				options.push({ members: { user: { id: user.id } } } as FindOptionsWhere<T>);
				options.push({ is_private: false } as FindOptionsWhere<T>);
			} else if (member === "true") {
				console.log("b");
				options.push({ members: { user: { id: user.id } } } as FindOptionsWhere<T>);
			} else if (member === "false") {
				//TODO use inner join
				console.log("c");
				//options.push({ members: Not(ArrayContains({ user: { id: user.id } })), is_private: false } as FindOptionsWhere<T>);
			}
			console.log(options);

			const rooms = await this.room_repo.findBy(options);
			return Promise.all(rooms.map((room) => room.serialize()));
		}

		// TODO: remove
		@Get("all")
		async all() {
			const rooms = await this.room_repo.find();
		
			return await Promise.all(rooms.map((room) => room.serialize()));
		}

		@Post()
		async create_room(@Me() user: User, @Body() dto: CreateRoomDTO) {
			const name = dto.name.trim();
			const room = await this.service.create(name, dto.is_private, dto.password);
			await this.service.add_member(room, user, Role.OWNER);
			return {};
		}

		@UseGuards(RoleGuard(Role.MEMBER))
		@Get("id/:id")
		async get_room(@GetRoom() room: T) {
			return await room.serialize();
		}

		@Post("id/:id/member(s)?")
		async join(@Me() me: User, @GetRoom() room: T, @Body("password") password?: string) {
			if (room.access == Access.PRIVATE) {
				throw new HttpException("Not found", HttpStatus.NOT_FOUND);
			}

			const banned_rooms = await me.banned_rooms;
			if (banned_rooms?.find(current => current.id === room.id))
				throw new HttpException("You have been banned from this channel", HttpStatus.FORBIDDEN); //TODO should this give "not found" for private rooms?
		
			if (room.access == Access.PROTECTED) {
				if (!password) {
					throw new HttpException("Missing password", HttpStatus.FORBIDDEN);
				}
				
				if (!await argon2.verify(room.password, password)) {
					throw new HttpException("Incorrect password", HttpStatus.FORBIDDEN);
				}
			}

			const member = new Member;

			member.role = Role.MEMBER;
			member.room = Promise.resolve(room);
			member.user = Promise.resolve(me);

			await this.member_repo.save(member);

			return {};
		}

		@UseGuards(RoleGuard(Role.MEMBER))
		@Delete("id/:id/member(s)?/:user_id")
		async remove_member(
			@Me() me: User,
			@Param("user_id", ParseIDPipe(User)) target: User,
			@GetMember() member: Member,
			@GetRoom() room: T,
			@Body("ban", ParseBoolPipe) ban?: boolean,
		) {
			const target_member = target.id === me.id ? member : await this.get_member(target, room);

			if (ban === true && member.role < Role.ADMIN)
				throw new HttpException("Insufficient permission", HttpStatus.FORBIDDEN);

			if (!target_member)
				throw new HttpException("Member not found", HttpStatus.NOT_FOUND);

			if (target_member.id !== member.id && target_member.role >= member.role)
				throw new HttpException("Insufficient permissions", HttpStatus.FORBIDDEN);

			if (target_member.role === Role.OWNER) {
				const members = await room.members;
				if (members.length > 1)
					throw new HttpException("You must transfer ownership before leaving a room as owner", HttpStatus.FORBIDDEN);
				await this.service.destroy(room);
			} else {
				await this.service.del_member(room, target_member, ban);
			}
		}

		@UseGuards(RoleGuard(Role.MEMBER))
		@Delete("id/:id/leave")
		async leave(@GetMember() member: Member, @GetRoom() room: T) {
			const members = await room.members;
		
			if (member.role == Role.OWNER ) {
				if (members.length > 1) {
					throw new HttpException("You must transfer ownership before leaving a room as owner", HttpStatus.FORBIDDEN);
				} else {
					await this.room_repo.remove(room);
				}
			}
		
			await this.member_repo.remove(member);

			return {};
		}

		@UseGuards(RoleGuard(Role.OWNER))
		@Post("id/:id/owner")
		async giveOwnership(
			@GetMember() member: Member,
			@GetRoom() room: T,
			@Body("owner", ParseUsernamePipe) new_owner: User
		) {
			const target_member = await this.get_member(new_owner, room);
		
			if (!target_member)
				throw new HttpException("user not a member of this room", HttpStatus.FORBIDDEN);
			
			if (target_member.id == member.id) {
				throw new HttpException("already owner", HttpStatus.UNPROCESSABLE_ENTITY);
			}
		
			member.role = Role.ADMIN;
			target_member.role = Role.OWNER;
		
			await this.member_repo.save([member, target_member]);

			return {};
		}

		@UseGuards(RoleGuard(Role.OWNER))
		@Delete("id/:id")
		async delete_room(@GetMember() member: Member, @GetRoom() room: T) {
			//TODO send event to room socket
			await this.room_repo.remove(room);

			return {};
		}

		@UseGuards(RoleGuard(Role.MEMBER))
		@Patch("id/:id/member(s)?/:user_id")
		async edit_member(
			@GetMember() member: Member,
			@GetRoom() room: T,
			@Param("username", ParseUsernamePipe) target: User,
			@Body("role", new ParseEnumPipe(Role)) role: Role
		) {
			const target_member = await this.get_member(target, room);
			if (!target_member)
				throw new HttpException("user not found", HttpStatus.NOT_FOUND);

			if (target_member.role >= member.role || role >= member.role)
				throw new HttpException("insufficient permissions", HttpStatus.FORBIDDEN);
			target_member.role = role;
			if (role === Role.OWNER)
				member.role = Role.ADMIN;
			await this.member_repo.save([member, target_member]);
		}

		/*
		@UseGuards(RoleGuard(Role.ADMIN))
		@Delete("id/:id/member(s)?/:user_id")
		async remove_member(
			@GetMember() member: Member,
			@GetRoom() room: T,
			@Param("username", ParseUsernamePipe) target: User,
			@Body("ban", ParseBoolPipe) ban?: boolean
		) {
			const target_member = await this.get_member(target, room);
			if (!target_member)
				throw new HttpException("user not found", HttpStatus.NOT_FOUND);
			if (target_member.role >= member.role)
				throw new HttpException("insufficient permissions", HttpStatus.FORBIDDEN);
			if (ban) {
				//TODO ban user
			}
			//TODO check if the member is also removed from the room
			await this.member_repo.remove(member);
		}*/

		@UseGuards(RoleGuard(Role.MEMBER))
		@Get("id/:id/invite(s)?")
		async room_invites(@GetRoom() room: T) {
			const invites = await room.invites;

			return Promise.all(invites.map((invite) => invite.serialize()));
		}

		@UseGuards(RoleGuard(Role.ADMIN))
		@Post("id/:id/invite")
		async create_invite(
			@GetMember() member: Member,
			@GetRoom() room: T,
			@Body("username", ParseUsernamePipe) target: User
		) {
			if (await this.get_member(target, room))
				throw new HttpException("user already member of this room", HttpStatus.FORBIDDEN);

			const invite = new RoomInvite;

			invite.from = member.user;
			invite.to = Promise.resolve(target);
			invite.room = Promise.resolve(room);

			await this.invite_repo.save(invite);

			return {}
		}

		@Post("id/:id/accept")
		async accept_invite(@Me() me: User,	@GetRoom() room: T) {
			const invites = await room.invites;
			const index = invites.findIndex(async (invite) => (await invite.to).id == me.id);

			if (index < 0) {
				throw new HttpException("Not invited", HttpStatus.NOT_FOUND);
			}

			const member = await room.add_member(me);

			const invite = invites.splice(index, 1);
			this.invite_repo.remove(invite);

			await this.member_repo.save(member);
			await this.room_repo.save(room);

			console.log(room);

			return {ok: true};
		}

		@Post("id/:id/deny")
		async deny_invite(@Me() me: User,	@GetRoom() room: T) {
			const invites = await room.invites;
			const index = invites.findIndex(async (invite) => (await invite.to).id == me.id);

			if (index < 0) {
				throw new HttpException("Not invited", HttpStatus.NOT_FOUND);
			}

			// const member = await room.add_member(me);

			const invite = invites.splice(index, 1);
			this.invite_repo.remove(invite);

			// await this.member_repo.save(member);
			// await this.room_repo.save(room);

			console.log(room);

			return {ok: true};
		}
	}
	return RoomControllerFactory;
}

export class TestController extends GenericRoomController(GameRoom) {
}
