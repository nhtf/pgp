import { User } from './User';
import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	Column,
} from 'typeorm';
import { ChatRoom } from './ChatRoom';

@Entity()
export class Message {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn()
	time: Date;

	@ManyToOne(() => User)
	user: Promise<User>;

	@ManyToOne(() => ChatRoom, (room) => room.messages)
	room: Promise<ChatRoom>;

	@Column()
	content: string;
}
