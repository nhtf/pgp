import { FriendRequest } from './FriendRequest';
import { RoomInvite } from './RoomInvite';
import { ChatRoom } from './ChatRoom';
import { GameRequest } from './GameRequest';
import { AuthLevel } from '../auth/AuthLevel';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToMany,
	JoinTable,
	OneToMany,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { AVATAR_DIR, DEFAULT_AVATAR, BACKEND_ADDRESS } from '../vars';
import { join } from 'path';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	user_id: number;

	@Exclude()
	@Column()
	oauth_id: number;

	@Exclude()
	@Column()
	auth_req: AuthLevel;

	@Exclude()
	@Column({
		nullable: true,
	})
	secret: string | null;

	@Column({
		nullable: true,
	})
	username: string | null;

	@Exclude()
	@Column({
		default: DEFAULT_AVATAR,
		//TODO remove this attribute
		nullable: true,
	})
	avatar_base: string; 

	@OneToMany(() => FriendRequest, (request) => request.from)
	sent_friend_requests: Promise<FriendRequest[]>;

	@OneToMany(() => FriendRequest, (request) => request.to)
	incoming_friend_requests: Promise<FriendRequest[]>;

	@OneToMany(() => GameRequest, (request) => request.from)
	sent_game_invite: Promise<GameRequest[]>;

	@OneToMany(() => GameRequest, (request) => request.to)
	incoming_game_invite: Promise<GameRequest[]>;

	@OneToMany(() => RoomInvite, (invite) => invite.from)
	sent_room_invites: Promise<RoomInvite[]>;

	@OneToMany(() => RoomInvite, (invite) => invite.to)
	incoming_room_invites: Promise<RoomInvite[]>;

	@ManyToMany(() => User)
	@JoinTable()
	friends: Promise<User[]>;

	@Column({
		nullable: true,
	})
	online: boolean;

	@OneToMany(() => ChatRoom, (chatRoom: ChatRoom) => chatRoom.owner)
	owned_chat_rooms: Promise<ChatRoom[]>;

	@ManyToMany(() => ChatRoom, (chatRoom: ChatRoom) => chatRoom.admins)
	admin_chat_rooms: Promise<ChatRoom[]>;

	@ManyToMany(() => ChatRoom, (chatroom: ChatRoom) => chatroom.members)
	all_chat_rooms: Promise<ChatRoom[]>;

	@Expose()
	get avatar(): string {
		return BACKEND_ADDRESS + '/' + this.avatar_path;
	}

	get avatar_basename(): string {
		return this.avatar_base + '.jpg';
	}

	get avatar_path(): string {
		return join(AVATAR_DIR, this.avatar_basename);
	}

	async add_friend(target: User) {
		const user_friends = await this.friends;
		if (user_friends) user_friends.push(target);
		else this.friends = Promise.resolve([target]);
	}
}
