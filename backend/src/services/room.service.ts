import { Room } from "../entities/Room";
import { User } from "../entities/User";
import { Member } from "../entities/Member";
import { Repository, FindOptionsWhere, Not } from "typeorm";
import { Access } from "../enums/Access";
import { GameRoom } from "../entities/GameRoom";
import { Controller, Inject, Get, Param, HttpException, HttpStatus, Post, Body, Delete, ParseBoolPipe, Patch, ParseEnumPipe, UseGuards, createParamDecorator, ExecutionContext, UseInterceptors, ClassSerializerInterceptor, Injectable, CanActivate, mixin, Put } from "@nestjs/common";
import { IsString, Length, IsOptional, IsBoolean } from "class-validator";
import { Role } from "../enums/Role";
import { Me, ParseUsernamePipe } from "../util";
import { AuthGuard } from "../auth/auth.guard";
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
	@UseGuards(AuthGuard)
	@UseInterceptors(ClassSerializerInterceptor)
	@Controller(route || type.name.toString().toLowerCase())
	class RoomControllerFactory {
		constructor(
			@Inject(type.name.toString().toUpperCase() + "_REPO") readonly room_repo: Repository<T>,
			@Inject("MEMBER_REPO") readonly member_repo: Repository<Member>,
			@Inject("ROOMINVITE_REPO") readonly invite_repo: Repository<RoomInvite>,
		) {}

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

		// TODO: remove
		@Get("all")
		async all() {
			const rooms = await this.room_repo.find();
		
			return await Promise.all(rooms.map((room) => room.serialize()));
		}

		@Get("joinable")
		async joinable(@Me() me: User) {
			const visible = await this.room_repo.findBy({ is_private: false } as FindOptionsWhere<T>);
			const mine = await this.user_rooms(me);
			const ids = mine.map((room) => room.id);
			const rooms = visible.filter((room) => !ids.includes(room.id));

			return await Promise.all(rooms.map((room) => room.serialize()));
		}

		@Get("mine") 
		async mine(@Me() me: User) {
			const rooms = await this.user_rooms(me);

			return await Promise.all(rooms.map((room) => room.serialize()));
		}

		@Post()
		async create_room(@Me() user: User, @Body() dto: CreateRoomDTO) {
			
			//TODO remove any newlines in the name
			const name = dto.name.trim();
		
			if (await this.room_repo.findOneBy({ name: name, is_private: false } as FindOptionsWhere<T>)) {
				throw new HttpException("a room with that name already exists", HttpStatus.FORBIDDEN);
			}
			
			const room = new type();
			
			room.name = name;
			room.is_private = dto.is_private;
			if (!room.is_private && dto.password) {
				try {
					room.password = await argon2.hash(dto.password);
				} catch (err) {
					console.error(err);
					throw new HttpException("could not create room", HttpStatus.INTERNAL_SERVER_ERROR);
				}
			}
			const member = await room.add_member(user, Role.OWNER);
		
			await this.room_repo.save(room);
			await this.member_repo.save(member);
			
			return {};
		}

		@UseGuards(RoleGuard(Role.MEMBER))
		@Get("id/:id")
		async get_room(@GetRoom() room: T) {
			return await room.serialize();
		}

		@Post("id/:id/join")
		async join(@Me() me: User, @GetRoom() room: T, @Body("password") password?: string) {
			if (room.access == Access.PRIVATE) {
				throw new HttpException("Not found", HttpStatus.NOT_FOUND);
			}
		
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
		}

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

			// invites.splice(index, 1);

			await this.member_repo.save(member);
			await this.room_repo.save(room);

			console.log(room);

			return {};
		}

		async user_rooms(me: User) {
			const members = await me.members;
			const rooms = await Promise.all(members.map((member) => member.room));

			return rooms;
		}
	}
	return RoomControllerFactory;
}

export class TestController extends GenericRoomController(GameRoom) {
}
