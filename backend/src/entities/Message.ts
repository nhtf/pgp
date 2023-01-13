import { User } from './User';
import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	Column,
} from 'typeorm';
import { ChatRoom } from './ChatRoom';
import { instanceToPlain } from 'class-transformer';

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

	@ManyToOne(() => ChatRoom, (room) => room.messages, { onDelete: "CASCADE"})
	room: Promise<ChatRoom>;

	async serialize() {
		return {
			...instanceToPlain(this),
			user: await this.user,
		};
	}
}
