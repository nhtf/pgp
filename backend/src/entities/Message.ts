import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	OneToMany,
	Column,
	RelationId,
} from "typeorm";
import { Exclude, Expose, Transform } from "class-transformer";
import { ChatRoom } from "./ChatRoom";
import { Member } from "./Member";
import { Embed } from "./Embed";

@Entity()
export class Message {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn({ type: 'timestamptz' })
	created: Date;

	@Column()
	content: string;
	
	@OneToMany(() => Embed, (embed) => embed.message, { eager: true, cascade: true })
	embeds: Embed[];

	@ManyToOne(() => Member, (member) => member.messages, { onDelete: "CASCADE" })
	member: Member;

	@ManyToOne(() => ChatRoom, (room) => room.messages, { onDelete: "CASCADE" })
	room: ChatRoom;
}
