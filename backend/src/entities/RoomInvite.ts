import { User } from './User';
import { ChatRoom } from './ChatRoom';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
} from 'typeorm';

@Entity()
export class RoomInvite {
	@PrimaryGeneratedColumn()
	id!: number;

	@CreateDateColumn()
	date: Date;

	@ManyToOne(() => User, (user) => user.sent_room_invites)
	from: Promise<User>;

	@ManyToOne(() => User, (user) => user.incoming_room_invites)
	to: Promise<User>;

	@ManyToOne(() => ChatRoom, (room) => room.invites)
	room: Promise<ChatRoom>;
}
