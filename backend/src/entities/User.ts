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
	BeforeRemove,
	AfterInsert,
	CreateDateColumn,
} from "typeorm";
import { Exclude, Expose, instanceToPlain } from "class-transformer";
import { AVATAR_DIR, DEFAULT_AVATAR, BACKEND_ADDRESS, AVATAR_EXT } from "../vars";
import { join } from "path";
import { Room } from "./Room";
import { Status } from "../enums/Status";
import { Invite } from "./Invite";
import { get_status } from "src/gateways/get_status";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Subject } from "src/enums/Subject";
import { Action } from "src/enums/Action";

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
	})
	avatar_base: string; 

	@OneToMany(() => Invite, (invite) => invite.from)
	sent_invites: Invite[];

	@OneToMany(() => Invite, (invite) => invite.to)
	received_invites: Invite[];

	@Exclude()
	@ManyToMany(() => User, (friend) => friend.friends)
	@JoinTable()
	friends: User[];

	@Exclude()
	@OneToMany(() => Member, (member) => member.user)
	members: Member[];

	@Exclude()
	@ManyToMany(() => Room, (room) => room.banned_users)
	banned_rooms: Room[];

	@Exclude()
	@Column({
		default: false
	})
	has_session: boolean;

	@Exclude()
	@CreateDateColumn()
	last_activity: Date;

	@Expose()
	get status(): Status {
		if (this.has_session)
			return get_status(this.last_activity);
		else
			return Status.OFFLINE;
	}

	@Expose()
	get avatar(): string {
		return BACKEND_ADDRESS + "/" + this.avatar_path;
	}

	get avatar_basename(): string {
		return this.avatar_base + AVATAR_EXT;
	}

	get avatar_path(): string {
		return join(AVATAR_DIR, this.avatar_basename);
	}

	async add_friend(target: User) {
		const user_friends = this.friends;
	
		if (user_friends) {
			user_friends.push(target);
		} else {
			this.friends = [target];
		}
	}

	async send_update(action: Action) {
		await UpdateGateway.instance.send_update({
			subject: Subject.USER,
			identifier: this.id,
			action,
			value: instanceToPlain(this),
		});
	}

	@AfterInsert()
	async afterInsert() {
		await this.send_update(Action.ADD);
	}

	@AfterUpdate()
	async afterUpdate() {
		// TODO: reduce amount
		// await this.send_update(Action.SET);
	}

	@BeforeRemove()
	async beforeRemove() {
		await this.send_update(Action.REMOVE);
	}
}
