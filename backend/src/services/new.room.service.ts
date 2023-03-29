import type { Room } from "src/entities/Room";
import type { Member } from "src/entities/Member";
import type { User } from "src/entities/User";
import { RoomInvite } from "src/entities/RoomInvite";
import { Repository, FindOneOptions, FindOptionsWhere, FindOptionsRelations, SelectQueryBuilder } from "typeorm";
import { Role } from "src/enums";
import * as argon2 from "argon2";

export interface CreateRoomOptions {
	name: string;
	is_private?: boolean;
	password?: string;
}

export interface AddMemberType {
	user: User;
	role?: Role;
}

export interface EditMemberType {
	member: Member;
	role: Role;

}

export interface IRoomService<T extends Room, U extends Member, S extends CreateRoomOptions> {
	save(...rooms: T[]): Promise<T[]>;
	remove(...rooms: T[]): Promise<void>;

	get(where?: any): Promise<T[]>;
	create(options: S): Promise<T>;
	edit(room: T, options: Partial<S>): Promise<T>;

	get_members(room: T): Promise<Member[]>;
	get_member(room: T, user: User): Promise<Member | undefined>;
	add_members(room: T, ...members: AddMemberType[]): Promise<Member[]>;
	edit_members(room: T, ...members: EditMemberType[]): Promise<Member[]>;
	remove_members(room: T, ...members: { member: U, ban?: boolean }[]): Promise<void>;

	get_bans(room: T): Promise<User[]>;
	is_banned(room: T, ...users: User[]): Promise<boolean[]>;
	unban(room: T, ...users: User[]): Promise<void>;

	is_member(room: T, ...users: User[]): Promise<boolean[]>;
	areMember(room: T, ...members: U[]): Promise<boolean>;
	verify(room: T, password: string): Promise<boolean>;

	joined_rooms(user: User): Promise<T[]>;
	owned_rooms(user: User): Promise<T[]>;

	query(): SelectQueryBuilder<T>;
}

export function GenericRoomService<T extends Room, U extends Member, S extends CreateRoomOptions = CreateRoomOptions>(RoomType: (new () => T), MemberType: (new () => U)) {
	abstract class RoomService<T extends Room, U extends Member> implements IRoomService<T, U, S> {

		constructor(
			readonly room_repo: Repository<T>,
			readonly member_repo: Repository<U>,
		) {}

		// Database
	
		async save(...rooms: T[]) {
			return this.room_repo.save(rooms);
		}

		async remove(...rooms: T[]) {
			await this.room_repo.remove(rooms);
		}

		// Room
	
		async get(where?: any) {
			return this.room_repo.findBy(where ?? {});
		}

		async create({ name, is_private, password }: S) {
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

		async edit(room: T, { name, is_private, password }: Partial<S>): Promise<T> {
			room.name = name ?? room.name;
			room.is_private = is_private ?? room.is_private;
			if (password)
				room.password = await argon2.hash(password);
			return room as unknown as T;
		}

		// Members

		async get_members(room: T) {
			return room.members;
		}

		async get_member(room: T, user: User): Promise<Member | undefined> {
			return room.members.find(({ userId }) => userId === user.id);
		}

		async add_members(room: T, ...members: AddMemberType[]) {
			const adding = members
				.filter(({ user }) => room.users.some(({ id }) => id === user.id))
				.map(({ user, role }) => {
					const member = new MemberType();
				
					member.user = user;
					member.role = role ?? Role.MEMBER;
					member.room = room;
				
					return member;
			});
		
			room.members.push(...adding);

			return adding;
		}

		async edit_members(room: T, ...members: EditMemberType[]): Promise<U[]> {
			const list = members.map(({ member, role }) => {
				member.role = role;
				return member;
			});
			return this.member_repo.save(list as unknown as U[]);
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

			return room;
		}

		async unban(room: T, ...users: User[]) {
			room = await this.find(room, { banned_users: true });

			room.banned_users = room.banned_users.filter((user) => !users.some(({ id }) => id === user.id))
		}

		// Util
	
		async find(room: T, relations: any) {
			return this.room_repo.findOne({ where: { id: room.id }, relations: relations as FindOptionsRelations<T> } as FindOneOptions<T>)
		}

		async self(room: T, user: User) {
			return room.members.find(({ userId }) => userId === user.id);
		}

		async areMember(room: T, ...members: U[]) {
			return room.members.every(({ id }) => members.some((member) => member.id === id));
		}

		async areInvited(room: T, ...users: User[]) {
			room = await this.find(room, { invites: true });
		
			return room.invites.every((invite) => users.some((user) => user.id === invite.to.id));
		}

		async get_bans(room: T): Promise<User[]> {
			room = await this.find(room, { banned_users: true });
			return room.banned_users;
		}

		async is_banned(room: T, ...users: User[]): Promise<boolean[]> {
			room = await this.find(room, { banned_users: true });
		
			return users.map(({ id }) => room.banned_users.some((user) => user.id === id));
			//return room.banned_users.every(({ id }) => users.some((user) => user.id === id));
		}

		async is_member(room: T, ...users: User[]): Promise<boolean[]> {
			return users.map(({ id }) => room.members.some(({ userId }) => userId === id));
		}

		async verify(room: T, password: string): Promise<boolean> {
			return await argon2.verify(room.password, password);

		}
		
		async joined_rooms(user: User) {
			return this.room_repo.findBy({
				members: {
					user: {
						id: user.id
					}
				},
			} as FindOptionsWhere<T>);
		}
	
		async owned_rooms(user: User) {
			return this.room_repo.findBy({
				members: {
					role: Role.OWNER,
					user: {
						id: user.id
					}
				},
			} as FindOptionsWhere<T>);
		}

		query() {
			return this.room_repo.createQueryBuilder("room");
		}


	}

	return RoomService<T, U>;
}
