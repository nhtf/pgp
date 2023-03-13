import type { Response } from "express";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Room } from "../entities/Room";
import { randomBytes } from "node:crypto";
import { User } from "../entities/User";
import { Member } from "../entities/Member";
import { Repository, FindOptionsWhere, FindOptionsRelations, SelectQueryBuilder } from "typeorm";
import { Access, Role, Subject, Action } from "src/enums";
import { Controller, Inject, Get, Param, HttpStatus, Post, Body, Delete, Patch, ParseEnumPipe, UseGuards, createParamDecorator, ExecutionContext, UseInterceptors, ClassSerializerInterceptor, Injectable, CanActivate, mixin, Put, Query, UsePipes, ValidationPipe, SetMetadata, ForbiddenException, NotFoundException, BadRequestException, UnprocessableEntityException, Res } from "@nestjs/common";
import { IsString, Length, IsBoolean, ValidateIf, ValidationOptions } from "class-validator";
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
	@IsNullable()
	name: string | null;

	@IsBoolean()
	@IsNullable()
	is_private: boolean | null;

	@IsString()
	@Length(1, 200)
	@ValidateIf((obj) => obj.is_private === false)
	@IsNullable()
	password: string | null;
}

export interface IRoomService<T extends Room, U extends Member> {
	create(name?: string, is_private?: boolean, password?: string): Promise<T>;
	destroy(room: number | T): Promise<boolean>;
	add_member(room: number | T, user: number | User, role?: Role): Promise<U>;
	edit_member(room: number | T, role: Role, member: U | User | number): Promise<U>;
	del_member(room: number | T, member: U | User | number, ban?: boolean): Promise<boolean>;
}

export function getRoomService<T extends Room, U extends Member>(room_repo: Repository<T>, member_repo: Repository<U>, invite_repo: Repository<RoomInvite>, user_repo: Repository<User>, type: (new () => T), MemberType: (new () => U)) {
	class RoomService<T extends Room> implements IRoomService<T, U> {
		constructor(
			readonly room_repo: Repository<T>,
			readonly member_repo: Repository<U>,
			readonly invite_repo: Repository<RoomInvite>,
			readonly user_repo: Repository<User>,
			readonly type: (new () => T),
		) { }

		async create(name: string | null, is_private: boolean, password: string | null): Promise<T> {
			if (!name) {
				name = randomBytes(30).toString("hex");
			}

			if (!is_private && await this.room_repo.findOneBy({ name: name, is_private: false } as FindOptionsWhere<T>))
				throw new ForbiddenException(`A room with the name "${name}" already exists`);

			const room = new this.type();
			room.name = name;
			room.is_private = is_private || false;
			if (!room.is_private && password)
				room.password = await argon2.hash(password);
			room.members = [];
			return room;
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
					where: { id: room } as FindOptionsWhere<T>,
				});
			return room;
		}

		async get_room_or_fail(room: number | T): Promise<T> {
			room = await this.get_room(room);
			if (!room)
				throw new NotFoundException(ERR_ROOM_NOT_FOUND);
			return room;
		}

		// Unused
		async destroy(room: number | T) {
			room = await this.get_room(room);
			await this.room_repo.remove(room);
			return true;
		}

		async add_member(room: number | T, user:  User, role?: Role): Promise<U> {
			room = await this.get_room(room);
		
			// const existing = await this.member_repo.findOneBy({
			// 	room: {
			// 		id: room.id,
			// 	},
			// 	user: {
			// 		id: user.id,
			// 	}
			// } as FindOptionsWhere<U>);

			const existing = room.members.find((member) => member.userId === user.id);
		
			if (existing) {
				throw new ForbiddenException("Already member of room");
			}

			const member = new MemberType();
			member.role = role || Role.MEMBER;
			member.room = room;
			member.user = user;

			if (!room.members) {
				room.members = [];
			}

			room.members.push(member);

			return member;
		}

		async del_member(room: number | T, member: U | User | number, ban?: boolean) {
			room = await this.get_room(room);

			if (!(member instanceof Member))
				member = await this.member_repo.findOneBy({ room: { id: room.id }, user: { id: typeof member === "number" ? member : member.id } } as FindOptionsWhere<U>);
			if (!member)
				return false;

			const index = room.members?.findIndex(x => x.id === (member as Member).id);
			if (index === undefined || index < 0)
				throw new NotFoundException("Member not found");
			room.members.splice(index, 1);
			if (ban === true) {
				let user = member.user;

				if (user === undefined)
					console.error("member.user was undefined, please make sure to also load the user relation for the member");

				user = await this.user_repo.findOneBy({ members: { id: member.id } });

				if (!room.banned_users) {
					room.banned_users = [];
				}

				room.banned_users.push(user);
			
				await this.room_repo.save(room);
			}

			await this.member_repo.remove(member);

			return true;
		}

		// Unused
		async edit_member(room: number | T, role: Role, member: U | User | number): Promise<U> {
			room = await this.get_room(room);

			if (!(member instanceof Member))
				member = await this.member_repo.findOneBy({ room: { id: room.id }, user: { id: typeof member === "number" ? member : member.id } } as FindOptionsWhere<U>);
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
		const request = ctx.switchToHttp().getRequest();

		if (!request.room) {
			throw new NotFoundException(ERR_ROOM_NOT_FOUND);
		}

		return request.room;
	}
);

export function GenericRoomController<T extends Room, U extends Member, C extends CreateRoomDTO = CreateRoomDTO>(type: (new () => T), MemberType: (new () => U), route?: string, c?: (new () => C)): any {
	@UseGuards(HttpAuthGuard, RolesGuard)
	@UseInterceptors(ClassSerializerInterceptor)
	@Controller(route || type.name.toString().toLowerCase())
	class RoomControllerFactory {
		constructor(
			@Inject(type.name.toString().toUpperCase() + "_REPO")
			readonly room_repo: Repository<T>,
			@Inject(MemberType.name.toString().toUpperCase() + "_REPO")
			readonly member_repo: Repository<U>,
			@Inject("ROOMINVITE_REPO")
			readonly invite_repo: Repository<RoomInvite>,
			@Inject(type.name.toString().toUpperCase() + "_PGPSERVICE")
			readonly service: IRoomService<T, U>,
			readonly update_service: UpdateGateway,
		) {
		}

		async get_member(user: User, room: Room): Promise<U | null> {
			return this.member_repo.findOneBy({ user: { id: user.id }, room: { id: room.id } } as FindOptionsWhere<U>);
		}

		isMemberQuery(qb: SelectQueryBuilder<T>, user: User) {
			return qb
				.subQuery()
				.from(Member, "member")
				.select("member.roomId")
				.select("member.userId")
				.where(`"roomId" = room.id`)
				.andWhere(`"userId" = :userId`, { userId: user.id })
				.getQuery();
		}

		joinedQuery(user: User) {
			return this.room_repo.createQueryBuilder("room")
				.where((qb) => `EXISTS (${this.isMemberQuery(qb, user)})`)
		}

		// TODO: Check banned users
		joinableQuery(user: User) {
			return this.room_repo.createQueryBuilder("room")
				.where((qb) => `NOT EXISTS (${this.isMemberQuery(qb, user)})`)
				.andWhere("room.is_private = false")
		}

		relations(qb: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
			return qb;
		}

		loadRelations(qb: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
			return this.relations(qb
				.leftJoinAndSelect("room.members", "member")
				.leftJoinAndSelect("member.user", "user")
			);
				
		}

		@Get("joined")
		async joined(@Me() me: User) {
			const qb = this.joinedQuery(me);
			const rooms = await this.loadRelations(qb).getMany();

			return rooms.map((room) => {
				return {
					...instanceToPlain(room),
					self: room.self(me),
					joined: true,
				}
			});
		}

		@Get("joinable")
		async joinable(@Me() me: User) {
			const qb = this.joinableQuery(me);
			const rooms = await this.loadRelations(qb).getMany();

			return rooms.map((room) => {
				return {
					...instanceToPlain(room),
					joined: false,
				}
			});
		}

		@Post()
		@UsePipes(new ValidationPipe({ expectedType: c || CreateRoomDTO }))
		async create_room(@Me() user: User, @Body() dto: C) {
			const name = dto.name ? dto.name.trim() : genName();
		
			let room = await this.service.create(name, dto.is_private, dto.password);
			let member = await this.service.add_member(room, user, Role.OWNER);

			room = await this.setup_room(room, dto);
			room = await this.room_repo.save(room);

			this.update_service.send_update({
				subject: Subject.ROOM,
				id: room.id,
				action: Action.SET,
				value: {
					owner: room.owner,
					self: instanceToPlain(member),
					joined: true,
				}
			}, user)

			return room;
		}

		async setup_room(room: T, dto: C): Promise<T> {
			return room;
		}

		async get_joined_info(room: T): Promise<T> {
			return room;
		}

		@Get("id/:id")
		@RequiredRole(Role.MEMBER)
		async get_room(@Me() me: User, @GetRoom() room: T) {
			return { ...instanceToPlain(room), self: room.self(me)}
		}

		@Patch("id/:id")
		@RequiredRole(Role.OWNER)
		async edit_room(@GetRoom() room: T, @Body() dto: CreateRoomDTO) {
			if (dto.is_private && dto.password) {
				throw new UnprocessableEntityException("A private room cannot have a password");
			}

			room.name = dto.name ?? genName();
			room.password = dto.password ? await argon2.hash(dto.password) : null;
			room.is_private = dto.is_private;

			await this.room_repo.save(room);
	
			room.send_update({
				subject: Subject.ROOM,
				id: room.id,
				action: Action.SET,
				value:  { name: room.name, access: room.access },
			});

			return {};
		}

		@Post("id/:id/member(s)?")
		async join(
			@Me() me: User,
			@Param("id", ParseIDPipe(type, { banned_users: true })) room: T,
			@Body("password") password?: string
		) {
			const invites = await this.invite_repo.findBy({ room: {	id: room.id	}, to: { id: me.id } });

			if (!invites && room.access == Access.PRIVATE) {
				throw new NotFoundException(ERR_ROOM_NOT_FOUND);
			}

			if (room.banned_users?.find(current => current.id === me.id) !== undefined)
				throw new ForbiddenException("You have been banned from this channel");

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

			let member = await this.service.add_member(room, me);

			await this.member_repo.save(member);
			await this.invite_repo.remove(invites);
			await this.afterJoin(room, member)

			room = await this.get_joined_info(room);

			this.update_service.send_update({
				subject: Subject.ROOM,
				id: room.id,
				action: Action.SET,
				value: {
					joined: true,
					self: instanceToPlain(member)
				},
			}, me);

			return {};
		}

		async afterJoin(room: T, member: U) { }

		/* deprecated, use id/:id/members/me */
		//TODO remove
		@Delete("id/:id/leave")
		async leave(
			@Res() res: Response,
		) {
			res.redirect(HttpStatus.PERMANENT_REDIRECT, "members/me");
		}


		@Get("id/:id/member(s)?")
		@RequiredRole(Role.MEMBER)
		async list_members(@GetRoom() room: T) {
			return this.member_repo.find({
				relations: {
					user: true,
				} as FindOptionsRelations<U>,
				where: {
					room: {
						id: room.id,
					},
				} as FindOptionsWhere<U>,
			});
		}

		@Delete("id/:id/member(s)?/me")
		@RequiredRole(Role.MEMBER)
		async user_leave(
			@GetMember() member: U,
			@Res() res: Response,
		) {
			res.redirect(`${member.id}`);
		}

		@Delete("id/:id/member(s)?/:target")
		@RequiredRole(Role.MEMBER)
		async remove_member(
			@GetMember() member: U,
			@GetRoom() room: T,
			@Param("target", ParseIDPipe(MemberType)) target: U,
			@Body("ban") ban: boolean,
		) {
			if (member.id !== target.id && target.role >= member.role) {
				console.log(member.role + " " + target.role);
				throw new ForbiddenException(ERR_PERM);
			}

			if (ban && member.role < Role.ADMIN) {
				throw new ForbiddenException(ERR_PERM);
			}

			if (target.role === Role.OWNER) {
				if (room.members.length > 1) {
					throw new ForbiddenException("You must transfer ownership before leaving a room as owner");
				}

				return await this.service.destroy(room);
			}

			await this.service.del_member(room, target, ban);

			this.update_service.send_update({
				subject: Subject.ROOM,
				action: Action.SET,
				id: room.id,
				value: { joined: false },
			}, target.user);

			return {};
		}

		@Delete("id/:id")
		@RequiredRole(Role.OWNER)
		async delete_room(@GetRoom() room: T) {
			return await this.room_repo.remove(room);
		}

		@Patch("id/:id/member(s)?/:target")
		@RequiredRole(Role.MEMBER)
		async edit_member(
			@GetMember() member: U,
			@GetRoom() room: T,
			@Param("target", ParseIDPipe(MemberType, { room: true })) target: U,
			@Body("role", new ParseEnumPipe(Role)) role: Role
		) {
			if (target.room.id !== room.id) {
				throw new BadRequestException(ERR_NOT_MEMBER);
			}

			if (target.role >= member.role || (role !== Role.OWNER && role >= member.role)) {
				throw new ForbiddenException(ERR_PERM);
			}

			target.role = role;

			await this.member_repo.save(target);

			if (role === Role.OWNER) {
				member.role = Role.ADMIN;
				await this.member_repo.save(member);
			}

			return {};
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
			@Param("id", ParseIDPipe(type, { banned_users: true, invites: true })) room: T,
			@Body("username", ParseUsernamePipe) target: User
		) {
			if (room.members.find((member) => member.user.id === target.id)) {
				throw new ForbiddenException("User already member of this room");
			}

			if (room.invites?.find((invite) => invite.to.id === target.id)) {
				throw new ForbiddenException("Already invited this user");
			}

			if (room.banned_users?.find((user) => user.id === target.id)) {
				throw new ForbiddenException("Cannot invite banned user");
			}

			const invite = new RoomInvite;

			invite.from = me;
			invite.to = target;
			invite.room = room;

			return await this.invite_repo.save(invite);
		}

		@Delete("id/:id/invite(s)?/:invite")
		async delete_invite(
			@Me() me: User,
			@GetRoom() room: T,
			@Param("invite", ParseIDPipe(RoomInvite, { room: true })) invite: RoomInvite,
		) {
			if (invite.room.id !== room.id) {
				throw new NotFoundException("Not found");
			}

			if (invite.from.id !== me.id && invite.to.id !== me.id) {
				if (room.access === Access.PRIVATE)
					throw new NotFoundException("Not found");
				else
					throw new ForbiddenException(ERR_PERM);
			}

			return await this.invite_repo.remove(invite);
		}

		@Get("id/:id/ban(s)?")
		@RequiredRole(Role.ADMIN)
		async list_bans(@Param("id", ParseIDPipe(type, { banned_users: true })) room: T) {
			return room.banned_users;
		}

		@Delete("id/:id/ban(s)?/:user_id")
		@RequiredRole(Role.ADMIN)
		async remove_ban(
			@GetRoom() room: T,
			@Param("user_id", ParseIDPipe(User)) target: User,
		) {
			const index = room.banned_users?.findIndex(user => user.id === target.id);

			if (index < 0) {
				throw new NotFoundException("User not banned");
			}

			room.banned_users.splice(index, 1);

			return await this.room_repo.save(room);
		}
	}
	return RoomControllerFactory;
}
