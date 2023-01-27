import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	Column,
} from "typeorm";
import { Exclude, instanceToPlain } from "class-transformer";
import { ChatRoom } from "./ChatRoom";
import { Member } from "./Member";

@Entity()
export class Message {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn()
	time: Date;

	@Column()
	content: string;

	@Exclude()
	@ManyToOne(() => Member, { onDelete: "CASCADE" })
	member: Promise<Member>;

	@Exclude()
	@ManyToOne(() => ChatRoom, (room) => room.messages, { onDelete: "CASCADE" })
	room: Promise<ChatRoom>;

	async serialize() {
		const member = await this.member;
	
		return {
			...instanceToPlain(this),
			member: await member.serialize(),
		};
	}
}
