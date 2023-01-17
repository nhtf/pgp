import { User } from './User';
import { ChatRoom } from './ChatRoom';
import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
} from 'typeorm';
import { instanceToPlain } from 'class-transformer';

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

	@ManyToOne(() => ChatRoom, (room) => room.invites, { onDelete: "CASCADE"})
	room: Promise<ChatRoom>;

	async serialize() {
		return {
			...instanceToPlain(this),
			from: await this.from,
			to: await this.to,
			room: await (await this.room).serialize(),
		}
	}
}
