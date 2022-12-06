import { Column, CreateDateColumn, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Repository } from 'typeorm';
import { User } from './UserService';

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
