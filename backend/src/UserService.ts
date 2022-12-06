import { Injectable, Inject } from '@nestjs/common';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, OneToMany} from 'typeorm';
import { ChatRoom } from './Chat';
import { DEFAULT_AVATAR } from './vars';

export enum AuthLevel {
	None,
	OAuth,
	TWOFA
}

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	user_id: number;

	@Column()
	oauth_id: number;

	@Column()
	auth_req: AuthLevel;

	@Column({
		nullable: true
	})
	secret: string | undefined;

	@Column({
		nullable: true
	})
	username: string | undefined;

	@Column()
	has_avatar: boolean;

	@OneToMany(() => FriendRequest, (request) => request.from)
	sent_friend_requests: Promise<FriendRequest[]>;

	@OneToMany(() => FriendRequest, (request) => request.to)
	incoming_friend_requests: Promise<FriendRequest[]>;

	@OneToMany(() => GameRequest, (request) => request.from)
	sent_game_invite: Promise<GameRequest[]>;

	@OneToMany(() => GameRequest, (request) => request.to)
	incoming_game_invite: Promise<GameRequest[]>;

	@ManyToMany(() => User)
	@JoinTable()
	friends: Promise<User[]>;

	@Column({
		nullable: true
	})
	online: boolean;

	@OneToMany(() => ChatRoom, (chatRoom: ChatRoom) => chatRoom.owner)
	owned_chat_rooms: Promise<ChatRoom[]>;

	@OneToMany(() => ChatRoom, (chatroom) => chatroom.members)
	all_chat_rooms: Promise<ChatRoom[]>;
}

@Entity()
export class FriendRequest {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	date: Date;

	@ManyToOne(() => User, (user) => user.sent_friend_requests)
	from: Promise<User>;

	@ManyToOne(() => User, (user) => user.incoming_friend_requests)
	to: Promise<User>;
}

@Entity()
export class GameRequest {
	@PrimaryGeneratedColumn()
	id!: number;

	@ManyToOne(() => User, (user) => user.sent_game_invite)
	from: Promise<User>;

	@ManyToOne(() => User, (user) => user.incoming_game_invite)
	to: Promise<User>;
}

@Injectable()
export class UserService {
	constructor(@Inject('USER_REPO') private readonly repo: Repository<User>) {}

	async get_user(where: FindOptionsWhere<User>): Promise<User | undefined> {
		const result = await this.repo.findOne({
			where: where,
			relations: {
				friends: true,
			}
		});
		if (result == null)
			return undefined;
		return result;
	}

	async get_user_by_name(username: string): Promise<User | undefined> {
		const result = await this.repo.findOne({
			where: {
				username: username
			}
		});
		if (result == null)
			return undefined;
		return result;
	}

	async save(users: User[]) {
		return await this.repo.save(users);
	}

	async exists(user_id: number): Promise<boolean> {
		return (await this.get_user({ user_id: user_id })) !== null;
	}
}
