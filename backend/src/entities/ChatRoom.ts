import { User } from './User';
import { Message } from './Message';
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, ManyToMany, OneToMany, JoinTable } from 'typeorm';

@Entity()
export class ChatRoom {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		   default: 'null'
	})
	name: string;

	@Column({
		default: true
	})
	visibile: boolean;

	@Column({
		   nullable: true
	})
	password: string;

	@ManyToOne(() => User, (user) => user.owned_chat_rooms)
	owner: Promise<User>;

	@ManyToMany(() => User, (user) => user.all_chat_rooms)
	@JoinTable()
	members:  Promise<User[]>;

	@OneToMany(() => Message, (message) => message.room)
	messages: Promise<Message[]>;
}
