import { FriendRequest } from "./FriendRequest";
import { Member } from "./Member";
import { AuthLevel } from "../enums/AuthLevel";
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToMany,
	JoinTable,
	OneToMany,
	AfterUpdate,
} from "typeorm";
import { Exclude, Expose } from "class-transformer";
import { AVATAR_DIR, DEFAULT_AVATAR, BACKEND_ADDRESS } from "../vars";
import { join } from "path";
import { Room } from "./Room";
import { Role } from "src/enums/Role";
import { Status } from "../enums/Status";
import { Invite } from "./Invite";
import { get_status } from "src/gateways/get_status";

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
	sent_friend_requests: FriendRequest[];

	@OneToMany(() => FriendRequest, (request) => request.to)
	incoming_friend_requests: FriendRequest[];

	@OneToMany(() => Invite, (invite) => invite.from)
	sent_invites: Invite[];

	@OneToMany(() => Invite, (invite) => invite.to)
	received_invites: Invite[];

	@ManyToMany(() => User)
	@JoinTable()
	friends: User[];

	@Exclude()
	@OneToMany(() => Member, (member) => member.user)
	members: Member[];

	@Exclude()
	@ManyToMany(() => Room)
	banned_rooms: Room[];

	@Column({
		default: false
	})
	has_session: boolean;

	@Column({
	       nullable: true
	})
	last_activity: Date;

	@Expose()
	get avatar(): string {
		return BACKEND_ADDRESS + "/" + this.avatar_path;
	}

	@Expose()
	get status(): Status {
		if (this.has_session)
			return get_status(this.last_activity?.getTime());
		else
			return Status.OFFLINE;
	}

	get avatar_basename(): string {
		return this.avatar_base + ".jpg";
	}

	get avatar_path(): string {
		return join(AVATAR_DIR, this.avatar_basename);
	}

	async add_friend(target: User) {
		const user_friends = await this.friends;
		if (user_friends) user_friends.push(target);
		else this.friends = [target];
	}

	/*
	toMember(room: Room, role?: Role): Member {
		const member = new Member;

		member.user = Promise.resolve(this);
		member.room = Promise.resolve(room);
		member.role = role ? role : Role.MEMBER;

		return member;
	}*/
}
