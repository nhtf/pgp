import { Member } from "./Member";
import { AuthLevel } from "../enums/AuthLevel";
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToMany,
	JoinTable,
	OneToMany,
	BeforeRemove,
	AfterInsert,
	CreateDateColumn,
	OneToOne,
	JoinColumn,
	ManyToOne,
} from "typeorm";
import { Exclude, Expose, instanceToPlain } from "class-transformer";
import { AVATAR_DIR, DEFAULT_AVATAR, BACKEND_ADDRESS, AVATAR_EXT } from "../vars";
import { Room } from "./Room";
import { Status } from "../enums/Status";
import { Invite } from "./Invite";
import { get_status } from "src/util";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Subject } from "src/enums/Subject";
import { Action } from "src/enums/Action";
import { Player } from "./Player";
import { Message } from "./Message";
import { GameRoomMember } from "./GameRoomMember"
import { MatchHistory } from "./MatchHistory"
import { GameRoom } from "./GameRoom"

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
	@OneToMany(() => Message, (message) => message.user)
	messages: Message[];

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

	@OneToMany(() => Player, (player) => player.user)
	players: Player[];

	@ManyToOne(() => GameRoom, {
		nullable: true
	})
	activeRoom: GameRoom | null;

	@OneToOne(() => MatchHistory)
	@JoinColumn()
	matchHistory: MatchHistory;

	@Expose()
	get status(): Status {
		if (!this.has_session) {
			return Status.OFFLINE;
		}

		if (this.activeRoom) {
			return Status.INGAME;
		}

		return get_status(this.last_activity);	
	}

	@Expose()
	get avatar(): string {
		return `${BACKEND_ADDRESS}/${this.avatar_path}`;
	}

	get avatar_basename(): string {
		return `${this.avatar_base}${AVATAR_EXT}`;
	}

	get avatar_path(): string {
		return `${AVATAR_DIR}/${this.avatar_basename}`;
	}

	@Expose()
	get activeMember(): GameRoomMember | undefined {
		return this.members?.find((member: GameRoomMember) => member.is_playing) as GameRoomMember;
	}

	add_friend(target: User) {
		if (!this.friends) {
			this.friends = [];
		}

		this.friends.push(target);
	}

	send_update(action: Action = Action.SET) {
		UpdateGateway.instance.send_update({
			subject: Subject.USER,
			id: this.id,
			action,
			value: instanceToPlain(this),
		});
	}

	send_friend_update(action: Action, friend: User) {
		UpdateGateway.instance.send_update({
			subject: Subject.FRIEND,
			id: friend.id,
			action,
			value: instanceToPlain(friend),
		}, this);
	}

	@AfterInsert()
	afterInsert() {
		this.send_update(Action.ADD);
	}

	// Waaay to many updates, do not use
	// @AfterUpdate()
	// afterUpdate() {
	// 	this.send_update(Action.SET);
	// }

	@BeforeRemove()
	beforeRemove() {
		this.send_update(Action.REMOVE);
	}
}
