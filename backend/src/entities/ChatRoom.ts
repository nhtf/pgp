import { User } from './User';
import { Message } from './Message';
import { Entity, PrimaryGeneratedColumn, ManyToOne, ManyToMany, OneToMany } from 'typeorm';

@Entity()
export class ChatRoom {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User)
	owner: Promise<User>;

	@ManyToMany(() => User)
	members:  Promise<User[]>;

	@OneToMany(() => Message, (message) => message.room)
	messages: Promise<Message[]>;
}
