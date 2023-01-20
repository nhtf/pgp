import { User } from './User';
import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	Column,
} from 'typeorm';
import { instanceToPlain } from 'class-transformer';
import { ChatRoom } from './ChatRoom';

@Entity()
export class Message {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn()
	time: Date;

	@Column()
	content: string;

	@ManyToOne(() => User)
	user: Promise<User>;

	@ManyToOne(() => ChatRoom, (room) => room.messages)
	room: Promise<ChatRoom>;

	async serialize() {
		return {
			...instanceToPlain(this),
			user: await this.user,
		};
	}
}
