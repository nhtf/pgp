import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	Column,
} from "typeorm";
import { Exclude, Expose } from "class-transformer";
import { ChatRoom } from "./ChatRoom";
import { Member } from "./Member";

@Entity()
export class Message {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Expose()
	@CreateDateColumn({ type: 'timestamptz' })
	time: Date;

	@Column()
	content: string;

	@ManyToOne(() => Member, { onDelete: "CASCADE" })
	member: Member;

	@ManyToOne(() => ChatRoom, (room) => room.messages, { onDelete: "CASCADE" })
	room: ChatRoom;
}
