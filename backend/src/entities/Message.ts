import { User } from './User';
import { ChatRoom } from './ChatRoom';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Column } from 'typeorm';

@Entity()
export class Message {

	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn()
	time: Date;

	@ManyToOne(() => User)
	user: Promise<User>;

	@ManyToOne(() => ChatRoom)
	room: Promise<ChatRoom>;

	@Column()
	content: string;
}