import { Room } from "./entities/Room";
import { User } from "./entities/User";
import { Member } from "./entities/Member";
import { Repository, FindOptionsWhere } from "typeorm";
import { Access } from "./Enums/Access";
import { GameRoom } from "./entities/GameRoom";
import { Controller, Inject, Get, Param, HttpException, HttpStatus, Post, Body, Delete, ParseBoolPipe, Patch, ParseEnumPipe, UseGuards, createParamDecorator, ExecutionContext, UseInterceptors, ClassSerializerInterceptor, Injectable, CanActivate, mixin } from "@nestjs/common";
import { IsString, Length, IsOptional, IsBoolean } from "class-validator";
import { Role } from "./Enums/Role";
import { Me, ParseIDPipe } from "./util";
import { AuthGuard } from "./auth/auth.guard";
import { Observable } from "rxjs";
import { RoomInvite } from "./entities/RoomInvite";

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

@Injectable()
export class VisibleGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest();

		return request.room.access === Access.PUBLIC || request.member;
	}
}

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
			@Inject("MEMBER_REPO") readonly member_repo: Repository<Member>) {}

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

		@Get()
		async get_visible(@Me() user: User) {
			// const rooms = await this.room_repo.findBy({ is_private: false } as FindOptionsWhere<T>);
			const rooms = await this.room_repo.find();
		
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
			if (!room.is_private) {
				room.password = dto.password;
			}
			const member = await room.add_member(user, Role.OWNER);
			await this.room_repo.save(room);
			await this.member_repo.save(member);
			
			return {};
		}

		@UseGuards(VisibleGuard)
		@Get(":id")
		async get_room(@GetRoom() room: T) {
			return room.serialize();
		}
		
		//TODO make ParseIDPipe(type) return a promise that will throw errors for more natural navigation?
		@Patch(":id")
		async edit_room(
			@GetMember() member: Member,
			@GetRoom() room: T,
			@Body("owner", ParseIDPipe(User)) new_owner: User
		) {
			if (member.role !== Role.OWNER)
				throw new HttpException("not owner of this room", HttpStatus.FORBIDDEN);

			const target_member = await this.get_member(new_owner, room);
			if (!target_member)
				throw new HttpException("user not a member of this room", HttpStatus.FORBIDDEN);
			member.role = Role.ADMIN;
			target_member.role = Role.OWNER;
			await this.member_repo.save([member, target_member]);

			return {};
		}

		@UseGuards(RoleGuard(Role.OWNER))
		@Delete(":id")
		async delete_room(@GetMember() member: Member, @GetRoom() room: T) {
			//TODO send event to room socket
			await this.room_repo.remove(room);

			return {};
		}

		@UseGuards(VisibleGuard)
		@Get(":id/member(s)?")
		async list_members(@GetRoom() room: T) {
			return room.members;
		}

		@UseGuards(RoleGuard(Role.MEMBER))
		@Patch(":id/member(s)?/:user_id")
		async edit_member(
			@GetMember() member: Member,
			@GetRoom() room: T,
			@Param("user_id", ParseIDPipe(User)) target: User,
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
		@Delete(":id/member(s)?/:user_id")
		async remove_member(
			@GetMember() member: Member,
			@GetRoom() room: T,
			@Param("user_id", ParseIDPipe(User)) target: User,
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

		@Get(":id/invited")
		async is_invited(@Me() me: User, @GetRoom() room: T) {
			const invites = await room.invites;
			const invited_users = await Promise.all(invites.map((invite) => invite.to));
			const index = invited_users.findIndex((user) => user.id === me.id);
		
			return index >= 0;
		}

		@UseGuards(VisibleGuard)
		@Get(":id/invite(s)?")
		async list_invites(@GetRoom() room: T) {
			const invites = await room.invites;
		
			return Promise.all(invites.map((invite) => invite.serialize()));
		}

		@UseGuards(RoleGuard(Role.ADMIN))
		@Post(":id/invite(s)?")
		async create_invite(
			@GetMember() member: Member,
			@GetRoom() room: T,
			@Body("id", ParseIDPipe(User)) target: User
		) {
			if (await this.get_member(target, room))
				throw new HttpException("user already member of this room", HttpStatus.FORBIDDEN);

			const invites = await room.invites;
			const invite = new RoomInvite;

			invite.from = member.user;
			invite.to = Promise.resolve(target);
			invite.room = Promise.resolve(room);

			invites.push(invite);
	
			await this.room_repo.save(room);

			return {}
		}
	}
	return RoomControllerFactory;
}

export class TestController extends GenericRoomController(GameRoom) {
}
