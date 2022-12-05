import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './UserService';

class Message {
	user: User;
	time: Date;
	content: string;
}

@Entity()
export class Chat {
	@PrimaryGeneratedColumn()
	owner: User;

	@Column()
	participants: User[];

	@Column()
	messages: Message[];  
}

function sendChat(user: User, content: string) {
	const msg = new Message;

	msg.content = content;
	msg.time = new Date();
	msg.user = user;
}
