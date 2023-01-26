import { FriendRequest } from './FriendRequest';
import { Member } from './Member';
import { AuthLevel } from '../enums/AuthLevel';
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
import { Room } from './Room';
import { Role } from 'src/enums/Role';
import { Status } from '../enums/Status';
import { get_status } from "../services/activity.service";
import { Invite } from './Invite';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Exclude()
	@Column()
	oauth_id: number;

	@Exclude()
	@Column({
		   default: AuthLevel.OAuth
	})
	auth_req: AuthLevel;

	@Exclude()
	@Column({
		nullable: true,
	})
	secret: string | null;

	@Column({
		unique: true,
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

	@OneToMany(() => Invite, (invite) => invite.from)
	sent_invites: Promise<Invite[]>;

	@OneToMany(() => Invite, (invite) => invite.to)
	received_invites: Promise<Invite[]>;

	@ManyToMany(() => User)
	@JoinTable()
	friends: Promise<User[]>;

	@Exclude()
	@OneToMany(() => Member, (member) => member.user)
	members: Promise<Member[]>;

	@Column({
	       nullable: true
	})
	last_activity: Date;

	@Expose()
	get avatar(): string {
		return BACKEND_ADDRESS + '/' + this.avatar_path;
	}

	@Expose()
	get status(): Status {
		return get_status(this.last_activity?.getTime());
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

	toMember(room: Room, role?: Role): Member {
		const member = new Member;

		member.user = Promise.resolve(this);
		member.room = Promise.resolve(room);
		member.role = role ? role : Role.MEMBER;

		return member;
	}
}
