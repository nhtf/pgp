import type { UpdatePacket } from "src/gateways/update.gateway"
import { Member } from "./Member";
import { Action, AuthLevel, Status, Subject } from "src/enums";
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToMany,
	JoinTable,
	OneToMany,
	CreateDateColumn,
	OneToOne,
	JoinColumn,
	ManyToOne,
	RelationId,
} from "typeorm";
import { Exclude, Expose, instanceToPlain } from "class-transformer";
import { AVATAR_DIR, DEFAULT_AVATAR, BACKEND_ADDRESS, AVATAR_EXT } from "../vars";
import { Room } from "./Room";
import { GameRoom } from "./GameRoom";
import { Invite } from "./Invite";
import { get_status } from "src/util";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Player } from "./Player";
import { Message } from "./Message";
import { MatchHistory } from "./MatchHistory"
import { AchievementProgress } from "./AchievementProgress";

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Exclude()
	@Column({ nullable: true })
	oauth_id: number | null;

	@Exclude()
	@Column({ default: AuthLevel.OAuth })
	auth_req: AuthLevel;

	@Exclude()
	@Column({ nullable: true })
	secret: string | null;

	@Column({ nullable: true, unique: true })
	username: string | null;

	@Exclude()
	@Column({ default: DEFAULT_AVATAR })
	avatar_base: string;

	@Exclude()
	@Column({ default: false })
	has_session: boolean;

	@Exclude()
	@CreateDateColumn()
	last_activity: Date;

	@OneToMany(() => Invite, (invite) => invite.from)
	sent_invites: Invite[];

	@OneToMany(() => Invite, (invite) => invite.to)
	received_invites: Invite[];

	@Exclude()
	@ManyToMany(() => User, (friend) => friend.friends, { onDelete: "NO ACTION" })
	@JoinTable({ name: "friend" })
	friends: User[];

	@Exclude()
	@ManyToMany(() => User, (user) => user.blocked)
	@JoinTable({ name: "block" })
	blocked: User[];

	@Exclude()
	@OneToMany(() => Member, (member) => member.user)
	members: Member[];

	@Exclude()
	@OneToMany(() => Message, (message) => message.user)
	messages: Message[];

	@Exclude()
	@ManyToMany(() => Room, (room) => room.banned_users)
	banned_rooms: Room[];

	@OneToMany(() => Player, (player) => player.user)
	players: Player[];

	@Exclude()
	@ManyToOne(() => GameRoom, { nullable: true, onDelete: "SET NULL" })
	activeRoom: GameRoom | null;

	@RelationId((user: User) => user.activeRoom)
	activeRoomId: number;

	@OneToOne(() => MatchHistory)
	@JoinColumn()
	matchHistory: MatchHistory;

	@OneToMany(() => AchievementProgress, (achievement) => achievement.user)
	achievements: AchievementProgress[];

	@OneToMany(() => User, (bot) => bot.owner)
	bots: User[];

	@ManyToOne(() => User, (user) => user.bots, { cascade: ["insert", "remove"] })
	owner: User;

	@Column({ nullable: true })
	@Exclude()
	api_secret: string | null;

	@Column({ default: false })
	queueing: boolean;

	@Expose()
	get is_bot(): boolean {
		return this.api_secret !== null;
	}

	@Expose()
	get status(): Status {
		if (!this.has_session) {
			return Status.OFFLINE;
		}

		if (this.activeRoomId) {
			return Status.INGAME;
		}

		return get_status(this.last_activity);	
	}

	@Expose()
	get avatar(): string {
		return `${BACKEND_ADDRESS}/${this.avatar_path}`;
	}

	get avatar_path(): string {
		return `${AVATAR_DIR}/${this.avatar_basename}`;
	}

	get avatar_basename(): string {
		return `${this.avatar_base}${AVATAR_EXT}`;
	}

	add_friend(target: User) {
		if (!this.friends.length) {
			this.friends = [];
		}

		this.friends.push(target);
	}

	remove_friend(target: User) {
		if (!this.friends.length) {
			this.friends = [];
		}
	
		const index = this.friends.findIndex((user) => user.id === target.id);

		if (index >= 0) {
			this.friends.splice(index, 1);
		}
	}

	send_friend_update(action: Action, friend: User) {
		const packet: UpdatePacket = {
			subject: Subject.FRIEND,
			id: friend.id,
			action,
		};
	
		if (action === Action.INSERT) {
			packet.value = instanceToPlain(friend);
		}
	
		UpdateGateway.instance.send_update(packet, this);
	}
}
