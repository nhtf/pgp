import { User } from './User';
import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
} from 'typeorm';
import { Exclude, instanceToPlain } from 'class-transformer';
import { Room } from './Room';

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
	@ManyToOne(() => Room, (room) => room.invites)
	room: Promise<Room>;

	async serialize() {
		return {
			...instanceToPlain(this),
			from: await this.from,
			to: await this.to,
		}
	}
}
