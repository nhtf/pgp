import type { Room } from "src/entities/Room";
import { Member } from "src/entities/Member";
import { User } from "src/entities/User";
import { RoomInvite } from "src/entities/RoomInvite";
import { Controller, Inject, Get, Post, Delete, UseGuards, HttpCode, HttpStatus, UsePipes, ValidationPipe, Query, Body, createParamDecorator, ExecutionContext, NotFoundException, UseInterceptors, ClassSerializerInterceptor, Patch, ForbiddenException, ParseBoolPipe, BadRequestException, Param, Res, ParseEnumPipe } from "@nestjs/common";
import { Response } from "express";
import { HttpAuthGuard } from "src/auth/auth.guard";
import { SetupGuard } from "src/guards/setup.guard";
import { RolesGuard, RequiredRole } from "src/guards/role.guard";
import { Me } from "src/util";
import { Access, Action, Role, Subject } from "src/enums";
import { ERR_NOT_MEMBER, ERR_PERM, ERR_ROOM_NOT_FOUND } from "src/errors";
import { IRoomService, CreateRoomOptions } from "src/services/new.room.service";
import { UpdateGateway } from "src/gateways/update.gateway";
import { ParseIDPipe, ParseUsernamePipe } from "src/util"
import { RoomInviteService } from "src/services/roominvite.service";
import { instanceToPlain } from "class-transformer";
import { IsString, Length, IsOptional, IsBoolean } from "class-validator";
import { SelectQueryBuilder } from "typeorm"

class PasswordDTO {
	@IsString()
	@Length(0, 500)
	@IsOptional()
	password?: string;
}

class RemoveMemberDTO {
	@IsBoolean()
	@IsOptional()
	ban?: boolean;
}

export const GetRoom = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();

		if (!request.room) {
			throw new NotFoundException(ERR_ROOM_NOT_FOUND);
		}

		return request.room;
	}
);

export const GetMember = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();

		if (!request.member) {
			if (request.room?.access === Access.PRIVATE)
				throw new NotFoundException(ERR_ROOM_NOT_FOUND);
			else
				throw new ForbiddenException(ERR_PERM);
		}

		return request.member;
	}
);

const NO_MEMBER = null;//TODO add something like Role.NONE?

function all_of(array: boolean[]): boolean {
	return array.every((val) => val);
}

export function GenericRoomController<T extends Room, U extends Member, S extends CreateRoomOptions>(
	RoomType: (new () => T),
	MemberType: (new () => U),
	CreateRoomDTO: (new () => S),
	EditRoomDTO: (new () => Partial<S>),
	EditMemberDTO: (new () => Partial<U>),
	route: string,
) {
	@UseGuards(HttpAuthGuard, SetupGuard, RolesGuard)
	@UseInterceptors(ClassSerializerInterceptor)
	@Controller(route)
	class RoomControllerFactory {

		constructor(
			@Inject(`${RoomType.name.toString().toUpperCase()}_SERVICE`)
			readonly room_service: IRoomService<T, U, S>,
			readonly invite_service: RoomInviteService,
		) {
		}

		update(room: T, value: any) {
			UpdateGateway.instance.send_update({
				subject: Subject.ROOM,
				id: room.id,
				action: Action.UPDATE,
				value,
			}, ...(room.is_private ? room.users : []));
		}

		async get_rooms(me: User, filter: string) {
			switch (filter) {
				case "joined":
					return this.room_service.query()
						.where((qb) => `EXISTS (${this.isMemberQuery(qb, me)})`)
						.leftJoinAndSelect("room.members", "member")
						.leftJoinAndSelect("member.user", "self")
						.leftJoinAndSelect("member.player", "selfPlayer")
						.leftJoinAndSelect("selfPlayer.team", "selfTeam")
					
						.leftJoinAndSelect("room.state", "state")
						.leftJoinAndSelect("state.teams", "team")
						.leftJoinAndSelect("team.players", "player")
						.leftJoinAndSelect("player.user", "user")

						.getMany();
				case "joinable":
					return this.room_service.query()
						.where((qb) => `NOT EXISTS (${this.isMemberQuery(qb, me)})`)
						.andWhere("room.is_private = false")
						.leftJoinAndSelect("room.members", "member")
						.leftJoinAndSelect("member.user", "self")
						.leftJoinAndSelect("member.player", "selfPlayer")
						.leftJoinAndSelect("selfPlayer.team", "selfTeam")

						.leftJoinAndSelect("room.state", "state")
						.leftJoinAndSelect("state.teams", "team")
						.leftJoinAndSelect("team.players", "player")
						.leftJoinAndSelect("player.user", "user")

						.getMany();
				case "visible":
					return this.room_service.get([{ is_private: false }, { members: { user: { id: me.id } } }]);
				case undefined:
					throw new BadRequestException("Missing filter")
				default:
					throw new BadRequestException("Invalid filter")
			}
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

		// Room
	
		@Get()
		async list_rooms(@Me() me: User, @Query("filter") filter: string) {
			const rooms = await this.get_rooms(me, filter);
		
			return rooms.map((room) => {
				const self = room.self(me);
			
				return {
					...instanceToPlain(room),
					joined: Boolean(self),
					self,
				}
			});
		}

		@Post()
		@HttpCode(HttpStatus.NO_CONTENT)
		@UsePipes(new ValidationPipe({ expectedType: CreateRoomDTO }))
		async create_room(
			@Me() user: User,
			@Body() dto: S,
		) {
			const room = await this.room_service.create(dto);
		
			room.members = await this.room_service.add_members(room, { user, role: Role.OWNER });
		
			room.send_update({
				subject: Subject.ROOM,
				id: room.id,
				action: Action.UPDATE,
				value: { owner: room.owner }
			});
		
			UpdateGateway.instance.send_update({
				subject: Subject.ROOM,
				id: room.id,
				action: Action.UPDATE,
				value: {
					joined: true,
					self: room.self(user),
				}
			}, user)
			
			return room;
		}

		@Get(":id")
		@RequiredRole(Role.MEMBER)
		async get_room(@Me() me: User, @GetRoom() room: T) {
			return { ...instanceToPlain(room), joined: true, self: room.self(me) };
		}

		@Patch(":id")
		@RequiredRole(Role.OWNER)
		@UsePipes(new ValidationPipe({ expectedType: EditRoomDTO }))
		@HttpCode(HttpStatus.NO_CONTENT)
		async edit_room(
			@GetRoom() room: T,
			@Body() dto: Partial<S>,
		) {
			await this.room_service.edit(room, dto as any);
			await this.room_service.save(room);
		}

		@Delete(":id")
		@RequiredRole(Role.OWNER)
		@HttpCode(HttpStatus.NO_CONTENT)
		async delete_room(@GetRoom() room: T) {
			await this.room_service.remove(room);
		}

		// Members

		@Get(":id/member(s)?")
		@RequiredRole(Role.MEMBER)
		async get_members(@GetRoom() room: T) {
			return this.room_service.get_members(room);
		}

		@Post(":id/member(s)?")
		@HttpCode(HttpStatus.NO_CONTENT)
		@RequiredRole(NO_MEMBER)
		async join(
			@Me() me: User,
			@GetRoom() room: T,
			@Body() dto: PasswordDTO,
		) {
			if (await this.room_service.areBanned(room, me))
				throw new ForbiddenException("You have been banned from this room");

			const invites = await this.invite_service.get({ to: me, room });

			switch (room.access) {
				case Access.PRIVATE:
					if (invites.length === 0)
						throw new NotFoundException(ERR_ROOM_NOT_FOUND);
					break;
				case Access.PROTECTED:
					if (!dto.password)
						throw new BadRequestException("Missing password");
					if (!await this.room_service.verify(room, dto.password))
						throw new ForbiddenException("Incorrect password");
			}

			room.send_update({
				subject: Subject.USER,
				action: Action.UPDATE,
				id: me.id,
				value: { ...instanceToPlain(me)	}
			});
		
			await this.room_service.add_members(room, { user: me });
			await this.invite_service.remove(...invites);

			if (room.is_private) {
				UpdateGateway.instance.send_update({
					subject: Subject.ROOM,
					action: Action.UPDATE,
					id: room.id,
					value: { ...instanceToPlain(room) }
				}, me);
			}
		
			UpdateGateway.instance.send_update({
				subject: Subject.ROOM,
				action: Action.UPDATE,
				id: room.id,
				value: {
					joined: true,
					self: room.self(me),
				}
			}, me);

		}

		@Get(":id/member(s)?/me")
		@RequiredRole(Role.MEMBER)
		async get_my_member(
			@GetMember() member: U,
			@Res() response: Response,
		) {
			response.redirect(`${member.id}`);
		}

		@Get(":id/member(s)?/:member")
		@RequiredRole(Role.MEMBER)
		async get_member(
			@Param("member", ParseIDPipe(MemberType)) member: U,
		) {
			return member;
		}

		@Patch(":id/member(s)?/:target")
		@RequiredRole(Role.MEMBER)
		@UsePipes(new ValidationPipe({ expectedType: EditMemberDTO }))
		async edit_member(
			@GetRoom() room: T,
			@GetMember() member: U,
			@Param("target", ParseIDPipe(MemberType)) target: U,
			@Body() dto: Partial<U>,
		) {
			if (target.roomId !== room.id)
				throw new NotFoundException(); 

			if (target.role >= member.role || (dto.role !== Role.OWNER && dto.role >= member.role))
				throw new ForbiddenException(ERR_PERM);

			const changes = [{ id: target.id, ...dto } as Partial<U>];
			
			if (dto.role === Role.OWNER)
				changes.push({ id: member.id, role: Role.ADMIN } as Partial<U>);
		
			await this.room_service.save_members(...changes as U[]);
		}

		@Delete(":id/member(s)?/me")
		@RequiredRole(Role.MEMBER)
		async user_leave(
			@GetMember() member: U,
			@Res() response: Response,
		) {
			response.redirect(`${member.id}`);
		}


		@Delete(":id/member(s)?/:member")
		@RequiredRole(Role.MEMBER)
		@HttpCode(HttpStatus.NO_CONTENT)
		async remove_member(
			@GetRoom() room: T,
			@GetMember() self: U,
			@Param("member", ParseIDPipe(MemberType)) target: U,
			@Body() dto?: RemoveMemberDTO,
		) {
			if (!this.room_service.areMember(room, target)) {
				throw new ForbiddenException(ERR_NOT_MEMBER);
			}

			if (self.role <= target.role && target.userId != self.userId) {
				throw new ForbiddenException(ERR_PERM);
			}

			await this.room_service.remove_members(room, { member: target, ban: dto.ban });

			UpdateGateway.instance.send_update({
				subject: Subject.ROOM,
				action: Action.UPDATE,
				id: room.id,
				value: { joined: false },
			}, target.user);
		}

		@Get(":id/invite(s)?")
		@RequiredRole(Role.MEMBER)
		async list_invites(@GetRoom() room: T) {
			return this.invite_service.get({ room });
		}

		@Post(":id/invite(s)?")
		@RequiredRole(Role.ADMIN)
		@HttpCode(HttpStatus.NO_CONTENT)
		async create_invites(
			@GetRoom() room: T,
			@Me() me: User,
			@Body("username", ParseUsernamePipe()) target: User,
		) {
			if (all_of(await this.room_service.is_member(room, target)))
				throw new ForbiddenException("User already member of this room");
			if ((await this.invite_service.get({ from: me, to: target, room })).length !== 0)
				throw new ForbiddenException("Already invited this user");
			if (await this.room_service.areBanned(room, target))
				throw new ForbiddenException("Cannot invite banned user");
			await this.invite_service.save(...await this.invite_service.create({ from: me, to: target, room }));
		}

		@Delete(":id/invite(s)?/:invite")
		@HttpCode(HttpStatus.NO_CONTENT)
		async delete_invite(
			@Me() me: User,
			@GetRoom() room: T,
			@Param("invite", ParseIDPipe(RoomInvite, { room: true })) invite: RoomInvite
		) {
			if (invite.room.id !== room.id)
				throw new NotFoundException();

			const member = await this.room_service.get_member(room, me);

			if (member?.role !== Role.OWNER && invite.from.id !== me.id && invite.to.id !== me.id) {
				if (room.access == Access.PRIVATE)
					throw new NotFoundException();
				else
					throw new ForbiddenException(ERR_PERM);
			}
			await this.invite_service.remove(invite);
		}

		@Get(":id/ban(s?)")
		@RequiredRole(Role.ADMIN)
		async list_bans(@GetRoom() room: T) {
			return this.room_service.get_bans(room);
		}

		@Delete(":id/ban(s?)/:user_id")
		@RequiredRole(Role.ADMIN)
		@HttpCode(HttpStatus.NO_CONTENT)
		async remove_ban(
			@GetRoom() room: T,
			@Param("user_id", ParseIDPipe(User)) target: User,
		) {
			if (!await this.room_service.areBanned(room, target))
				throw new NotFoundException("User not banned");
			await this.room_service.unban(room, target);
		}

	}
	return RoomControllerFactory;
}
