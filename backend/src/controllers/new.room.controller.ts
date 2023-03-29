import type { Room } from "src/entities/Room";
import type { Member } from "src/entities/Member";
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
import { IsString, Length, IsOptional } from "class-validator";
import * as argon2 from "argon2";
import { SelectQueryBuilder, Not } from "typeorm"

class PasswordDTO {
	@IsString()
	@Length(1, 500)
	@IsOptional()
	password?: string;
}

export enum Filter {
	"joined",
	"joinable",
	"visible",
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

		isMemberQuery(qb: SelectQueryBuilder<T>, user: User) {
			return qb
				.subQuery()
				.from(MemberType, "member")
				.select("member.roomId")
				.select("member.userId")
				.where(`"roomId" = room.id`)
				.andWhere(`"userId" = :userId`, { userId: user.id })
				.getQuery();
		}

		// Room
	
		@Get()
		async list_rooms(@Me() me: User, @Query("filter") filter: string) {
			switch (filter) {
				case "joined":
					return this.room_service.joined_rooms(me);
				case "joinable":
					return this.room_service.query()
						.where((qb) => `NOT EXISTS (${this.isMemberQuery(qb, me)})`)
						.andWhere("room.is_private = false")
						.leftJoinAndSelect("room.members", "member")
						.leftJoinAndSelect("member.user", "self")
						.leftJoinAndSelect("member.player", "selfPlayer")
						.leftJoinAndSelect("selfPlayer.team", "selfTeam")
						.getMany();
				case "visible":
					return this.room_service.get([{ is_private: false }, { members: { user: { id: me.id } } }]);
				case undefined:
					throw new BadRequestException("Missing filter")
				default:
					throw new BadRequestException("Invalid filter")
			}
		}

		@Post()
		@HttpCode(HttpStatus.NO_CONTENT)
		@UsePipes(new ValidationPipe({ expectedType: CreateRoomDTO }))
		async create_room(
			@Me() user: User,
			@Body() dto: S,
		) {
			const room = await this.room_service.create(dto);
		
			await this.room_service.add_members(room, { user, role: Role.OWNER });
			await this.room_service.save(room);
		
			UpdateGateway.instance.send_update({
				subject: Subject.ROOM,
				id: room.id,
				action: Action.UPDATE,
				value: {
					joined: true,
					self: room.self(user),
				}
			}, user)
		}

		@Get(":id")
		@RequiredRole(Role.MEMBER)
		async get_room(@GetRoom() room: T) {
			return room;
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
			@GetRoom() room: T,
			@Me() me: User,
			@Body() dto: PasswordDTO,
		) {
			if (all_of(await this.room_service.is_banned(room, me)))
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

			await this.room_service.add_members(room, { user: me });
			await this.invite_service.remove(...invites);
			await this.room_service.save(room);
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

		@Patch(":id/member(s)?/:member")
		@RequiredRole(Role.MEMBER)
		async edit_member(
			@GetRoom() room: T,
			@GetMember() member: U,
			@Param("target", ParseIDPipe(MemberType)) target: U,
			@Body("role", new ParseEnumPipe(Role)) role: Role
		) {
			if (target.roomId !== room.id)
				throw new NotFoundException(); 

			if (target.role >= member.role || (role !== Role.OWNER && role >= member.role))
				throw new ForbiddenException(ERR_PERM);

			const changes = [{ member: target, role }];
			
			if (role === Role.OWNER)
				changes.push({ member: member, role: Role.ADMIN });
			await this.room_service.edit_members(room, ...(changes as any));
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
			@Body("ban", ParseBoolPipe) ban?: boolean,
		) {
			if (!this.room_service.areMember(room, target)) {
				throw new ForbiddenException(ERR_NOT_MEMBER);
			}

			if (self.role <= target.role) {
				throw new ForbiddenException(ERR_PERM);
			}

			await this.room_service.remove_members(room, { member: target, ban });
			await this.room_service.save(room);
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
			if (all_of(await this.room_service.is_banned(room, target)))
				throw new ForbiddenException("Cannot invite banned user");
			await this.invite_service.save(...await this.invite_service.create({ from: me, to: target, room }));
		}

		@Delete(":id/invite(s)/:invite")
		@HttpCode(HttpStatus.NO_CONTENT)
		async delete_invite(
			@GetRoom() room: T,
			@Me() me: User,
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
			if (!all_of(await this.room_service.is_banned(room, target)))
				throw new NotFoundException("User not banned");
			await this.room_service.unban(room, target);
		}

	}
	return RoomControllerFactory;
}
