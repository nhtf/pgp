import { FriendRequest } from './FriendRequest';
import { ChatRoom } from './ChatRoom';
import { GameRequest } from './GameRequest';
import { AuthLevel } from '../auth/AuthLevel';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, OneToMany} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { AVATAR_DIR, DEFAULT_AVATAR, BACKEND_ADDRESS } from '../vars';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	user_id: number;

	@Column()
	oauth_id: number;

	@Exclude()
	@Column()
	auth_req: AuthLevel;

	@Exclude()
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

	@Expose()
	get avatar(): string {
		const avatar = this.has_avatar ?
			this.user_id.toString() : DEFAULT_AVATAR;
		return BACKEND_ADDRESS + '/' + AVATAR_DIR + '/' + avatar + '.jpg';
	}
}
