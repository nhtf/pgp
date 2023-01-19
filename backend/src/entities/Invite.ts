import { User } from './User';
import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	TableInheritance,
	ChildEntity,
} from 'typeorm';
import { instanceToPlain } from 'class-transformer';
import { ChatRoom } from './ChatRoom';
import { GameRoom } from './GameRoom';

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" }})
export class Invite {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn()
	date: Date;

	@ManyToOne(() => User, (user) => user.sent_room_invites)
	from: Promise<User>;

	@ManyToOne(() => User, (user) => user.incoming_room_invites)
	to: Promise<User>;

	async serialize() {
		return {
			...instanceToPlain(this),
			from: await this.from,
			to: await this.to,
		}
	}
}

@ChildEntity()
export class _RoomInvite extends Invite {
	@ManyToOne(() => ChatRoom, (room) => room.invites)
	room: Promise<ChatRoom>
}

@ChildEntity()
export class GameInvite extends Invite {
	// @ManyToOne(() => GameRoom, (room) => room.invites)
	// room: Promise<ChatRoom>
}

@ChildEntity()
export class FriendInvite extends Invite {}
