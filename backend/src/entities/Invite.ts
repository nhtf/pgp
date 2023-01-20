import { User } from './User';
import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
} from 'typeorm';
import { instanceToPlain } from 'class-transformer';

@Entity()
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
