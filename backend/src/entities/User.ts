import { FriendRequest } from './FriendRequest';
import { ChatRoom } from './ChatRoom';
import { GameRequest } from './GameRequest';
import { AuthLevel } from '../auth/AuthLevel';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, OneToMany} from 'typeorm';

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
