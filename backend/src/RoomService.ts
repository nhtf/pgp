import { Room } from "./entities/Room";
import { User } from "./entities/User";
import { Member } from "./entities/Member";
import { Repository, FindOptionsWhere } from "typeorm";
import { Access } from "./Enums/Access";
import { GameRoom } from "./entities/GameRoom";
import { dataSource } from "./app.module";

import { Controller, Inject, Get, Param, HttpException, HttpStatus, Post, Body, Delete, ParseBoolPipe, Patch, ParseEnumPipe, UseGuards } from "@nestjs/common";
import { IsString, Length, IsBooleanString, IsOptional } from "class-validator";
import { Role } from "./Enums/Role";
import { Me, ParseIDPipe } from "./util";
import * as argon2 from "argon2";
import { AuthGuard } from "./auth/auth.guard";

class CreateRoomDTO {
	@Length(3, 20)
	@IsString()
	name: string;

	@IsBooleanString()
	is_private: string;

	@IsString()
	@Length(1, 200)
	@IsOptional()
	password: string;
}

class RoomService<T extends Room> { 
	repository: Repository<Room>;
	member_repo: Repository<Member>;

	constructor(private readonly type: (new () => T)) {
		this.repository = dataSource.getRepository(Room);
		this.member_repo = dataSource.getRepository(Member);
	}

	async find(room: number | Room) {
		if (typeof room === "number")
			return this.repository.findOneBy({ id: room });
		return Promise.resolve(room);
	}

	async find_or_fail(room: number | Room) {
		const res = await this.find(room);
		if (!res)
			throw new Error("room not found");
		return res;
	}

	async find_visible(user: User): Promise<Room[]> {
		const list = await this.repository.find();
		return list;

		/*
		return await Promise.all(
			list.filter(async (room: Room) => {
				return (room.access !== Access.PRIVATE || (await room.members).find(async member => (await member.user).id === user.id))));
			       */
	}

	async find_member(user: User, room: Room): Promise<Member | null> {
		return this.member_repo.findOneBy({
			room: { id: room.id },
			user: { id: user.id }
		});
	}

	async create(name: string, password?: string, is_private?: boolean, owner?: User) {
		if (await this.repository.findOneBy([{
				name: name,
				access: Access.PUBLIC
			},
			{
				name: name,
				access: Access.PROTECTED 
			}])) {
			throw new Error("room already exists");
		}
		const room = new this.type();

		room.name = name;
		room.is_private = is_private ?? false;
		if (!room.is_private)
			room.password = password;
		if (owner)
			room.add_member(owner, Role.OWNER);
		return this.repository.save(room);
	}

	async delete(executor: User, room: number | Room) {
		const target = await this.find_or_fail(room);
		if (!target)
			throw new Error("room not found");
		const member = await this.find_member(executor, target);
		if (!member && target.access === Access.PRIVATE)
			throw new Error("not found");
		else if (!member || member.role !== Role.OWNER)
			throw new Error("forbidden")
		return this.repository.remove(target);
	}

	async join(executor: User, room: number | Room, password?: string) {
		const target = await this.find_or_fail(room);
		const member = await this.find_member(executor, target);
		if (member)
			throw new Error("already member of this room");

		//TODO Check if user was banned from the room 
		if (target.access === Access.PRIVATE) {
			//TODO check if user has invite
		} else if (target.access === Access.PROTECTED) {
			if (!password)
				throw new Error("password required");

			let authorized = false;

			try {
				authorized = await argon2.verify(target.password, password);
			} catch (err) {
				console.error(err);
				throw new Error("could not join room");
			}
			if (!authorized)
				throw new Error("invalid password");
		}
		await target.add_member(executor);
		return this.repository.save(target);
	}

	async set_role(executor: User, receiver: User, role: Role, room: number | Room) {
		const target = await this.find_or_fail(room);
		const exec_member = await this.find_member(executor, target);

		if (target.access === Access.PRIVATE && !exec_member)
			throw new Error("room not found");
		else if (!exec_member)
			throw new Error("not a member of this room");

		const recv_member = await this.find_member(receiver, target);
		if (!recv_member)
			throw new Error("user not in room");
		if (recv_member.role >= exec_member.role || exec_member.role <= role)
			throw new Error("insufficient permissions");
		recv_member.role = role;
		return this.repository.save(recv_member);
	}

	async transfer(executor: User, receiver: User, room: number | Room) {
		const target = await this.find_or_fail(room);
		const exec_member = await this.find_member(executor, target);

		if (target.access === Access.PRIVATE && !exec_member)
			throw new Error("room not found");
		else if (!exec_member || exec_member.role !== Role.OWNER)
			throw new Error("not the owner of this room");

		const recv_member = await this.find_member(receiver, target);
		if (!recv_member)
			throw new Error("target user is not a member of this room");
		recv_member.role = Role.OWNER;
		exec_member.role = Role.ADMIN;
		return this.repository.save([exec_member, recv_member]);
	}
}
export function GenericRoomController<T extends Room>(type: (new () => T), route?: string) {
	@UseGuards(AuthGuard)
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
			//TODO only return visible rooms
			const rooms = await this.room_repo.find();
			console.log(rooms);
			return rooms;
			//return this.room_service.find_visible(user);
		}

		@Get(":id")
		async get_room(@Me() user: User, @Param("id", ParseIDPipe(type)) room: T) {
			const member = await this.get_member_or_fail(user, room);
			//TODO properly serialize the room
			return room;
		}

		@Post()
		async create_room(@Me() user: User, @Body() dto: CreateRoomDTO) {

			//TODO remove any newlines in the name
			const name = dto.name.trim();
		
			if (await this.room_repo.findOneBy({ name: name, is_private: false } as FindOptionsWhere<T>))
				throw new HttpException("a room with that name already exists", HttpStatus.FORBIDDEN);
			const room = new type();

			room.name = name;
			room.is_private = Boolean(dto.is_private) ?? false;
			if (!room.is_private)
				room.password = dto.password;
			room.add_member(user, Role.OWNER);
			await this.room_repo.save(room);
		}

		//TODO make ParseIDPipe(type) return a promise that will throw errors for more natural navigation?
		@Patch(":id")
		async edit_room(
			@Me() user: User,
			@Param("id", ParseIDPipe(type)) room: T,
			@Body("owner", ParseIDPipe(User)) new_owner: User
		) {
			const member = await this.get_member_or_fail(user, room);

			if (member.role !== Role.OWNER)
				throw new HttpException("not owner of this room", HttpStatus.FORBIDDEN);

			const target_member = await this.get_member(new_owner, room);
			if (!target_member)
				throw new HttpException("user not a member of this room", HttpStatus.FORBIDDEN);
			member.role = Role.ADMIN;
			target_member.role = Role.OWNER;
			await this.member_repo.save([member, target_member]);
		}

		@Delete(":id")
		async delete_room(@Me() user: User, @Param("id", ParseIDPipe(type)) room: T) {
			const member = await this.get_member_or_fail(user, room);

			if (member.role !== Role.OWNER)
				throw new HttpException("not the owner of the room", HttpStatus.FORBIDDEN);
			//TODO send event to room socket
			await this.room_repo.remove(room);
		}

		@Get(":id/member(s)?")
		async list_members(@Me() user: User, @Param("id", ParseIDPipe(type)) room: T) {
			await this.get_member_or_fail(user, room);
			return this.member_repo.findBy({ room: { id: room.id } });
		}

		@Patch(":id/member(s)?/:user_id")
		async edit_member(
			@Me() user: User,
			@Param("id", ParseIDPipe(type)) room: T,
			@Param("user_id", ParseIDPipe(User)) target: User,
			@Body("role", new ParseEnumPipe(Role)) role: Role
		) {
			const member = await this.get_member_or_fail(user, room);
			const target_member = await this.get_member(target, room);
			if (!target_member)
				throw new HttpException("user not found", HttpStatus.NOT_FOUND);

			if (target_member.role >= member.role || (member.role !== Role.OWNER && role >= member.role))
				throw new HttpException("insufficient permissions", HttpStatus.FORBIDDEN);
			target_member.role = role;
			if (role === Role.OWNER)
				member.role = Role.ADMIN;
			await this.member_repo.save([member, target_member]);
		}

		@Delete(":id/member(s)?/:user_id")
		async remove_member(
			@Me() user: User,
		    	@Param("id", ParseIDPipe(type)) room: T,
		    	@Param("user_id", ParseIDPipe(User)) target: User,
		    	@Body("ban", ParseBoolPipe) ban?: boolean
		) {
			const member = await this.get_member_or_fail(user, room);
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

		@Get(":id/member(s)?/invite(s)?")
		async list_invites(
			@Me() user: User,
			@Param("id", ParseIDPipe(type)) room: T
		) {
			await this.get_member_or_fail(user, room);
			//TODO return invites
		}

		@Post(":id/member(s)?/invite(s)?")
		async create_invite(
			@Me() user: User,
			@Param("id", ParseIDPipe(type)) room: T,
			@Body("id", ParseIDPipe(User)) target: User
		) {
			const member = await this.get_member_or_fail(user, room);

			if (member.role < Role.ADMIN)
				throw new HttpException("insufficient permissions", HttpStatus.FORBIDDEN);
			if (await this.get_member(target, room))
				throw new HttpException("user already member of this room", HttpStatus.FORBIDDEN);
			//TODO create invite
		}
	}
	return RoomControllerFactory;
}

export class TestController extends GenericRoomController(GameRoom) {
}
