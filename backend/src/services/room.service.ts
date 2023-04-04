import type { Response } from "express";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Room } from "../entities/Room";
import { randomBytes } from "node:crypto";
import { User } from "../entities/User";
import { Member } from "../entities/Member";
import { Repository, FindOptionsWhere, FindOneOptions, SelectQueryBuilder } from "typeorm";
import { Access, Role, Subject, Action } from "src/enums";
import { Controller, Inject, Get, Param, HttpStatus, Post, Body, Delete, Patch, ParseEnumPipe, UseGuards, createParamDecorator, ExecutionContext, UseInterceptors, ClassSerializerInterceptor, Injectable, CanActivate, mixin, Put, Query, UsePipes, ValidationPipe, SetMetadata, ForbiddenException, NotFoundException, BadRequestException, UnprocessableEntityException, Res, GoneException, Req, HttpCode, ParseBoolPipe } from "@nestjs/common";
import { IsString, Length, IsBoolean, ValidateIf, ValidationOptions, IsOptional } from "class-validator";
import { Me, ParseUsernamePipe, ParseIDPipe } from "../util";
import { HttpAuthGuard } from "../auth/auth.guard";
import { RoomInvite } from "../entities/RoomInvite";
import * as argon2 from "argon2";
import { ERR_NOT_MEMBER, ERR_PERM, ERR_ROOM_NOT_FOUND } from "src/errors";
import { instanceToPlain } from "class-transformer";
import { genName } from "src/namegen";
import { RolesGuard } from "src/guards/role.guard"
import { RequiredRole } from "src/guards/role.guard"

export function IsNullable(validationOptions?: ValidationOptions) {
	return ValidateIf((_, value) => value !== null, validationOptions);
}

export class CreateRoomDTO {
	@IsString()
	@Length(3, 20)
	@IsOptional()
	name?: string;

	@IsBoolean()
	@IsNullable()
	is_private: boolean | null;

	@IsString()
	@Length(1, 200)
	@ValidateIf((obj) => obj.is_private === false)
	@IsNullable()
	password: string | null;
}

export class LeaveDTO {
	@IsBoolean()
	@IsOptional()
	ban?: boolean;
}

export interface IRoomService<T extends Room, U extends Member> {
	save(room: T): Promise<T>;
	create(name?: string, is_private?: boolean, password?: string): Promise<T>;
	destroy(...rooms: T[]): Promise<void>;
	add_member(room: T, user: User, role?: Role): Promise<U>;
	edit_member(room: T, member: U, role: Role): Promise<U>;
	del_member(room: T, member: U, ban?: boolean);
	owned_rooms(user: User): Promise<T[]>;
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
		const request = ctx.switchToHttp().getRequest();

		if (!request.room) {
			throw new NotFoundException(ERR_ROOM_NOT_FOUND);
		}

		return request.room;
	}
);

// export function GenericRoomService<T extends Room, U extends Member>(RoomType: (new () => T), MemberType: (new () => U)) {
// 	class RoomService<T extends Room> implements IRoomService<T, U> {
// 		constructor(
// 			readonly room_repo: Repository<T>,
// 			readonly member_repo: Repository<U>,
// 			readonly invite_repo: Repository<RoomInvite>,
// 			readonly user_repo: Repository<User>,
// 		) { }

// 		async save(room: T): Promise<T> {
// 			return this.room_repo.save(room);
// 		}

// 		async create(name: string | null, is_private: boolean, password: string | null): Promise<T> {
// 			if (!name) {
// 				name = randomBytes(30).toString("base64");
// 			}

// 			if (!is_private && await this.room_repo.findOneBy({ name, is_private: false } as FindOptionsWhere<T>))
// 				throw new ForbiddenException(`A room with the name "${name}" already exists`);

// 			const room = new RoomType;
		
// 			room.name = name;
// 			room.is_private = is_private;
// 			room.members = [];
// 			room.invites = [];
// 			room.banned_users = [];
		
// 			if (!room.is_private && password) {
// 				room.password = await argon2.hash(password);
// 			}

// 			// return await this.room_repo.save(room as unknown as T);

// 			return room as unknown as T;
// 		}

// 		// Unused
// 		async destroy(...rooms: T[]) {
// 			await this.room_repo.remove(rooms);
// 		}

// 		async add_member(room: T, user: User, role?: Role): Promise<U> {
// 			if (room.users.some(({ id }) => id === user.id)) {
// 				throw new ForbiddenException("Already member of room");
// 			}

// 			const member = new MemberType;
		
// 			member.user = user;
// 			member.role = role ?? Role.MEMBER;
// 			member.room = room;

// 			room.members.push(member);
			
// 			// return await this.member_repo.save(member);

// 			return member;
// 		}

// 		// Unused
// 		async edit_member(room: T, member: U, role: Role): Promise<U> {
// 			member.role = role;
	
// 			return this.member_repo.save(member);
// 		}

// 		async del_member(room: T, member: U, ban?: boolean) {
// 			const index = room.members?.findIndex((x) => x.id === member.id);
		
// 			if (index < 0) {
// 				throw new NotFoundException("Member not found");
// 			}
		
// 			// room.members.splice(index, 1);
		
// 			if (ban === true) {
// 				room = await this.room_repo.findOne({ where: { id: room.id }, relations: { banned_users: true } } as FindOneOptions<T>)

// 				room.banned_users.push({ id: member.userId } as User);
			
// 				await this.room_repo.save(room);
// 			}

// 			await this.member_repo.remove(member);
// 		}

// 		async owned_rooms(user: User): Promise<T[]> {
// 			return this.room_repo.findBy({ members: { role: Role.OWNER, user: { id: user.id } } } as FindOptionsWhere<T>)
// 		}
// 	}
// 	return RoomService;
// }

// export function getRoomService<T extends Room, U extends Member>(room_repo: Repository<T>, member_repo: Repository<U>, invite_repo: Repository<RoomInvite>, user_repo: Repository<User>, type: (new () => T), MemberType: (new () => U)) {
// 	return new (GenericRoomService<T, U>(type, MemberType))(room_repo, member_repo, invite_repo, user_repo);
// }

// export function GenericRoomController<T extends Room, U extends Member, C extends CreateRoomDTO = CreateRoomDTO>(type: (new () => T), MemberType: (new () => U), route?: string, c?: (new () => C)): any {
// 	@UseGuards(HttpAuthGuard, RolesGuard)
// 	@UseInterceptors(ClassSerializerInterceptor)
// 	@Controller(route || type.name.toString().toLowerCase())
// 	class RoomControllerFactory {
// 		constructor(
// 			@Inject(type.name.toString().toUpperCase() + "_REPO")
// 			readonly room_repo: Repository<T>,
// 			@Inject(MemberType.name.toString().toUpperCase() + "_REPO")
// 			readonly member_repo: Repository<U>,
// 			@Inject("ROOMINVITE_REPO")
// 			readonly invite_repo: Repository<RoomInvite>,
// 			@Inject(type.name.toString().toUpperCase() + "_PGPSERVICE")
// 			readonly service: IRoomService<T, U>,
// 			readonly update_service: UpdateGateway,
// 		) {
// 		}

// 		isMemberQuery(qb: SelectQueryBuilder<T>, user: User) {
// 			return qb
// 				.subQuery()
// 				.from(Member, "member")
// 				.select("member.roomId")
// 				.select("member.userId")
// 				.where(`"roomId" = room.id`)
// 				.andWhere(`"userId" = :userId`, { userId: user.id })
// 				.getQuery();
// 		}

// 		joinedQuery(user: User) {
// 			return this.room_repo.createQueryBuilder("room")
// 				.where((qb) => `EXISTS (${this.isMemberQuery(qb, user)})`)
// 		}

// 		// TODO: Check banned users
// 		joinableQuery(user: User) {
// 			return this.room_repo.createQueryBuilder("room")
// 				.where((qb) => `NOT EXISTS (${this.isMemberQuery(qb, user)})`)
// 				.andWhere("room.is_private = false")
// 		}

// 		relations(qb: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
// 			return qb;
// 		}

// 		loadRelations(qb: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
// 			return this.relations(qb
// 				.leftJoinAndSelect("room.members", "member")
// 				.leftJoinAndSelect("member.user", "self")
// 				.leftJoinAndSelect("member.player", "selfPlayer")
// 				.leftJoinAndSelect("selfPlayer.team", "selfTeam")
// 			);
// 		}

// 		async get_member(user: User, room: Room): Promise<U | null> {
// 			return this.member_repo.findOneBy({ user: { id: user.id }, room: { id: room.id } } as FindOptionsWhere<U>);
// 		}

// 		async onCreate(room: T, dto: C) { }
// 		async onJoin(room: T, member: U) { }

// 		@Get("joined")
// 		async joined(@Me() me: User) {
// 			const qb = this.joinedQuery(me);
// 			const rooms = await this.loadRelations(qb).getMany();

// 			return rooms.map((room) => {
// 				return {
// 					...instanceToPlain(room),
// 					joined: true,
// 					self: room.self(me),
// 				}
// 			});
// 		}

// 		@Get("joinable")
// 		async joinable(@Me() me: User) {
// 			const qb = this.joinableQuery(me);
// 			const rooms = await this.loadRelations(qb).getMany();

// 			return rooms.map((room) => {
// 				return {
// 					...instanceToPlain(room),
// 					joined: false,
// 				}
// 			});
// 		}

// 		@Post()
// 		@UsePipes(new ValidationPipe({ expectedType: c || CreateRoomDTO }))
// 		async create_room(@Me() user: User, @Body() dto: C) {
// 			const name = dto.name ? dto.name.trim() : genName();
// 			const room = await this.service.create(name, dto.is_private, dto.password);
		
// 			await this.onCreate(room, dto);
// 			await this.service.add_member(room, user, Role.OWNER);
// 			await this.service.save(room);

// 			UpdateGateway.instance.send_update({
// 				subject: Subject.ROOM,
// 				id: room.id,
// 				action: Action.UPDATE,
// 				value: {
// 					joined: true,
// 					self: room.self(user),
// 				}
// 			}, user)

// 			return room;
// 		}

// 		@Get("id/:id")
// 		@RequiredRole(Role.MEMBER)
// 		async get_room(@Me() me: User, @GetRoom() room: T) {
// 			return { ...instanceToPlain(room), joined: true, self: room.self(me)}
// 		}

// 		@Patch("id/:id")
// 		@RequiredRole(Role.OWNER)
// 		@HttpCode(HttpStatus.NO_CONTENT)
// 		async edit_room(@GetRoom() room: T, @Body() dto: CreateRoomDTO) {
// 			if (dto.is_private && dto.password) {
// 				throw new UnprocessableEntityException("A private room cannot have a password");
// 			}

// 			room.name = dto.name ?? genName();
// 			room.password = dto.password ? await argon2.hash(dto.password) : null;
// 			room.is_private = dto.is_private;

// 			await this.room_repo.save(room);
	
// 			room.send_update({
// 				subject: Subject.ROOM,
// 				id: room.id,
// 				action: Action.UPDATE,
// 				value: { name: room.name, access: room.access },
// 			});
// 		}

// 		@Delete("id/:id")
// 		@RequiredRole(Role.OWNER)
// 		@HttpCode(HttpStatus.NO_CONTENT)
// 		async delete_room(@Param("id", ParseIDPipe(type, { invites: true })) room: T) {
// 			await this.room_repo.remove(room);

// 			// Cascade delete doesn't trigger subscriber because why would it
// 			room.invites.forEach((invite) => {
// 				UpdateGateway.instance.send_update({
// 					subject: Subject.INVITE,
// 					action: Action.REMOVE,
// 					id: invite.id,
// 				});
// 			});
// 		}

// 		@Get("id/:id/member(s)?")
// 		@RequiredRole(Role.MEMBER)
// 		async list_members(@GetRoom() room: T) {
// 			return room.members;
// 		}

// 		@Post("id/:id/member(s)?")
// 		@HttpCode(HttpStatus.NO_CONTENT)
// 		async join(
// 			@Me() me: User,
// 			@Param("id", ParseIDPipe(type, { banned_users: true })) room: T,
// 			@Body() body: any,
// 		) {
// 			const invite = await this.invite_repo.findOneBy({ room: { id: room.id }, to: { id: me.id } });

// 			if (!invite) {
// 				if (room.access === Access.PRIVATE) {
// 					throw new NotFoundException(ERR_ROOM_NOT_FOUND);
// 				}
	
// 				if (room.access === Access.PROTECTED) {
// 					const password = body.password;
			
// 					if (!password) {
// 						throw new BadRequestException("Missing password");
// 					}
	
// 					if (!await argon2.verify(room.password, password)) {
// 						throw new ForbiddenException("Incorrect password");
// 					}
// 				}
// 			}

// 			if (room.banned_users.some((user) => user.id === me.id)) {
// 				throw new ForbiddenException("You have been banned from this channel");
// 			}


// 			const member = await this.service.add_member(room, me);

// 			await this.member_repo.save(member);
// 			await this.onJoin(room, member)
// 			await this.service.save(room);

// 			if (invite) {
// 				await this.invite_repo.remove(invite);
// 			}
		
// 			this.update_service.send_update({
// 				subject: Subject.ROOM,
// 				id: room.id,
// 				action: Action.UPDATE,
// 				value: {
// 					...instanceToPlain(room),
// 					joined: true,
// 					self: room.self(me),
// 				},
// 			}, me);
// 		}

// 		@Get("id/:id/self")
// 		@RequiredRole(Role.MEMBER)
// 		async self(@Me() me: User, @GetRoom() room: T) {
// 			return room.self(me);
// 		}

// 		@Delete("id/:id/member(s)?/me")
// 		@RequiredRole(Role.MEMBER)
// 		async user_leave(
// 			@GetMember() member: U,
// 			@Res() res: Response,
// 		) {
// 			res.redirect(`${member.id}`);
// 		}

// 		@Delete("id/:id/member(s)?/:target")
// 		@RequiredRole(Role.MEMBER)
// 		@HttpCode(HttpStatus.NO_CONTENT)
// 		async remove_member(
// 			@GetMember() member: U,
// 			@GetRoom() room: T,
// 			@Param("target", ParseIDPipe(MemberType)) target: U,
// 			@Body() dto: LeaveDTO,
// 		) {
// 			const ban = dto.ban;
		
// 			if (member.id !== target.id && target.role >= member.role) {
// 				throw new ForbiddenException(ERR_PERM);
// 			}

// 			if (ban && member.role < Role.ADMIN) {
// 				throw new ForbiddenException(ERR_PERM);
// 			}

// 			if (target.role === Role.OWNER) {
// 				if (room.members.length > 1) {
// 					throw new ForbiddenException("You must transfer ownership before leaving a room as owner");
// 				}

// 				return await this.service.destroy(room);
// 			}

// 			await this.service.del_member(room, target, ban);

// 			this.update_service.send_update({
// 				subject: Subject.ROOM,
// 				action: Action.UPDATE,
// 				id: room.id,
// 				value: { joined: false },
// 			}, target.user);
// 		}

// 		@Patch("id/:id/member(s)?/:target")
// 		@RequiredRole(Role.MEMBER)
// 		@HttpCode(HttpStatus.NO_CONTENT)
// 		async edit_member(
// 			@GetMember() member: U,
// 			@GetRoom() room: T,
// 			@Param("target", ParseIDPipe(MemberType)) target: U,
// 			@Body("role", new ParseEnumPipe(Role)) role: Role
// 		) {
// 			if (!room.members.map((member) => member.id).includes(target.id)) {
// 				throw new BadRequestException(ERR_NOT_MEMBER);
// 			}

// 			if (target.role >= member.role || (role !== Role.OWNER && role >= member.role)) {
// 				throw new ForbiddenException(ERR_PERM);
// 			}

// 			await this.member_repo.save({ id: target.id, role } as U);

// 			if (role === Role.OWNER) {
// 				await this.member_repo.save({ id: member.id, role: Role.ADMIN } as U);
// 			}
// 		}

// 		@Get("id/:id/invite(s)?")
// 		@RequiredRole(Role.MEMBER)
// 		async invites(@GetRoom() room: T) {
// 			return this.invite_repo.findBy({ room: { id: room.id } });
// 		}

// 		@Post("id/:id/invite(s)?")
// 		@RequiredRole(Role.ADMIN)
// 		@HttpCode(HttpStatus.NO_CONTENT)
// 		async create_invite(
// 			@Me() me: User,
// 			@Param("id", ParseIDPipe(type, { banned_users: true, invites: true })) room: T,
// 			@Body("username", ParseUsernamePipe()) target: User
// 		) {
// 			if (room.members.find((member) => member.user.id === target.id)) {
// 				throw new ForbiddenException("User already member of this room");
// 			}

// 			if (room.invites?.find((invite) => invite.to.id === target.id)) {
// 				throw new ForbiddenException("Already invited this user");
// 			}

// 			if (room.banned_users?.find((user) => user.id === target.id)) {
// 				throw new ForbiddenException("Cannot invite banned user");
// 			}

// 			await this.invite_repo.save({ from: me, to: target, room, type: room.type });
// 		}

// 		@Delete("id/:id/invite(s)?/:invite")
// 		@HttpCode(HttpStatus.NO_CONTENT)
// 		async delete_invite(
// 			@Me() me: User,
// 			@GetRoom() room: T,
// 			@Param("invite", ParseIDPipe(RoomInvite, { room: true })) invite: RoomInvite,
// 		) {
// 			if (invite.room.id !== room.id) {
// 				throw new NotFoundException("Not found");
// 			}

// 			if (invite.from.id !== me.id && invite.to.id !== me.id) {
// 				if (room.access === Access.PRIVATE)
// 					throw new NotFoundException("Not found");
// 				else
// 					throw new ForbiddenException(ERR_PERM);
// 			}

// 			await this.invite_repo.remove(invite);
// 		}

// 		@Get("id/:id/ban(s)?")
// 		@RequiredRole(Role.ADMIN)
// 		async list_bans(@Param("id", ParseIDPipe(type, { banned_users: true })) room: T) {
// 			return room.banned_users;
// 		}

// 		@Delete("id/:id/ban(s)?/:user_id")
// 		@RequiredRole(Role.ADMIN)
// 		@HttpCode(HttpStatus.NO_CONTENT)
// 		async remove_ban(
// 			@GetRoom() room: T,
// 			@Param("user_id", ParseIDPipe(User)) target: User,
// 		) {
// 			const index = room.banned_users?.findIndex(user => user.id === target.id);

// 			if (index < 0) {
// 				throw new NotFoundException("User not banned");
// 			}

// 			room.banned_users.splice(index, 1);

// 			await this.room_repo.save(room);
// 		}
// 	}
// 	return RoomControllerFactory;
// }
