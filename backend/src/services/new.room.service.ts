import type { Room } from "src/entities/Room";
import type { Member } from "src/entities/Member";
import { RoomInvite } from "src/entities/RoomInvite";
import type { User } from "src/entities/User";
import { Repository, FindOneOptions, DeepPartial, FindOptionsRelations } from "typeorm";
import { Role } from "src/enums";
import * as argon2 from "argon2";

export interface CreateRoomOptions {
	name: string;
	is_private?: boolean;
	password: string;
}

export interface IRoomService<T extends Room, U extends Member, S extends CreateRoomOptions> {
	save(...rooms: T[]): Promise<T[]>;
	get(): Promise<T[]>;
	create(options: S): Promise<T>;
	add_members(room: T, ...members: { user: User, role?: Role }[]): Promise<Member[]>;
}

export function GenericRoomService<T extends Room, U extends Member, S extends CreateRoomOptions>(RoomType: (new () => T), MemberType: (new () => U)) {
	abstract class RoomService<T extends Room, U extends Member> implements IRoomService<T, U, S> {

		constructor(
			readonly room_repo: Repository<T>,
			readonly member_repo: Repository<U>,
			readonly invite_repo: Repository<RoomInvite>,
		) {}

		// Util
	
		async find(room: T, relations: any) {
			return this.room_repo.findOne({ where: { id: room.id }, relations: relations as FindOptionsRelations<T> } as FindOneOptions<T>)
		}

		self(room: T, user: User) {
			return room.members.find(({ userId }) => userId === user.id);
		}

		areMember(room: T, ...users: User[]) {
			return room.users.every(({ id }) => users.some((user) => user.id === id));
		}

		async areInvited(room: T, ...users: User[]) {
			room = await this.find(room, { invites: true });
		
			return room.invites.every((invite) => users.some((user) => user.id === invite.to.id));
		}

		async areBanned(room: T, ...users: User[]) {
			room = await this.find(room, { banned_users: true });
		
			return room.banned_users.every(({ id }) => users.some((user) => user.id === id));
		}

		// Database
	
		async save(...rooms: T[]) {
			return this.room_repo.save(rooms);
		}

		async remove(...rooms: T[]) {
			await this.room_repo.remove(rooms);
		}

		// Room
	
		async get() {
			return this.room_repo.find();
		}

		async create({ name, is_private, password }: S) {
			// if (is_private == undefined)
			// 	is_private = false;

			const room = new RoomType();
		
			room.name = name;
			room.is_private = is_private ?? false;
			room.members = [];
			room.banned_users = [];

			if (!room.is_private && password) {
				room.password = await argon2.hash(password);
			}
			
			return room as unknown as T;
		}

		// Members

		async add_members(room: T, ...members: { user: User, role?: Role }[]) {
			const adding = members
				.filter(({ user }) => room.users.some(({ id }) => id === user.id))
				.map(({ user, role }) => {
					const member = new MemberType();
				
					member.user = user;
					member.role = role ?? Role.MEMBER;
					member.room = room;
				
					return member;
			});
		
			return adding;
		}

		async remove_members(room: T, ...members: { member: U, ban?: boolean }[]) {
			room = await this.find(room, { banned_users: true });

			const removing = members.map(({ member }) => member);
			const banning = members.filter(({ ban }) => ban).map(({ member }) => member.user);
		
			await this.member_repo.remove(removing);
			await this.ban(room, ...banning);
		}

		// Bans

		async banned(room: T) {
			room = await this.find(room, { banned_users: true });

			return room.banned_users;
		}

		async ban(room: T, ...users: User[]) {
			room = await this.find(room, { banned_users: true });

			room.banned_users.push(...users);

			await this.save(room);
		}

		async unban(room: T, ...users: User[]) {
			room = await this.find(room, { banned_users: true });

			room.banned_users = room.banned_users.filter((user) => !users.some(({ id }) => id === user.id))

			await this.save(room);
		}

		// Invites

		async invites(room: T) {
			room = await this.find(room, { invites: true });

			return room.invites;
		}
	
		async create_invites(room: T, from: User, ...users: User[]) {
			room = await this.find(room, { invites: true });

			const invites = users.map((user) => {
				const invite = new RoomInvite();

				invite.from = from;
				invite.to = user;
				invite.room = room;

				return invite;
			});

			return invites;
		}
	
		async remove_invites(...invites: RoomInvite[]) {
			await this.invite_repo.remove(invites);
		}
	}

	return RoomService<T, U>;
}
