import { User } from './User';
import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
} from 'typeorm';
import { Exclude, instanceToPlain } from 'class-transformer';
import { ChatRoom } from './ChatRoom';

@Entity()
export class RoomInvite {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn()
	date: Date;

	@ManyToOne(() => User, (user) => user.sent_room_invites)
	from: Promise<User>;

	@ManyToOne(() => User, (user) => user.incoming_room_invites)
	to: Promise<User>;

	@Exclude()
	@ManyToOne(() => ChatRoom, (room) => room.invites, { onDelete: "CASCADE"})
	room: Promise<ChatRoom>;

	async serialize() {
		return {
			...instanceToPlain(this),
			from: await this.from,
			to: await this.to,
		}
	}
}
