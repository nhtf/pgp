import { User } from './User';
import { Message } from './Message';
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { Exclude, Expose, Transform } from 'class-transformer';

@Entity()
export class ChatRoom {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		   default: 'null'
	})
	name: string;

	@Column({
		default: false 
	})
	private: boolean;

	@Exclude()
	@Column({
		   nullable: true
	})
	password: string | null;

	@ManyToOne(() => User, (user) => user.owned_chat_rooms)
	owner: Promise<User>;

	@ManyToMany(() => User, (user) => user.all_chat_rooms)
	@JoinTable()
	members:  Promise<User[]>;

	@OneToMany(() => Message, (message) => message.room)
	messages: Promise<Message[]>;

	@Expose()
	get has_password(): boolean {
		return this.password !== null;
	}
}
