import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	OneToMany,
	Column,
	RelationId,
} from "typeorm";
import { ChatRoom } from "./ChatRoom";
import { User } from "./User";
import { Member } from "./Member";
import { Embed } from "./Embed";
import { Exclude } from "class-transformer"

@Entity()
export class Message {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn({ type: 'timestamptz' })
	created: Date;

	@Column()
	content: string;
	
	@Exclude()
	@ManyToOne(() => ChatRoom, (room) => room.messages, { onDelete: "CASCADE" })
	room: ChatRoom;
	
	@ManyToOne(() => Member, (member) => member.messages, { nullable: true, onDelete: "SET NULL" })
	member: Member | null;

	@RelationId((message: Message) => message.member)
	memberId: number

	@Exclude()
	@ManyToOne(() => User, (user) => user.messages, { onDelete: "CASCADE" })
	user: User;

	@RelationId((message: Message) => message.user)
	userId: number;
	
	@OneToMany(() => Embed, (embed) => embed.message, { eager: true, cascade: true })
	embeds: Embed[];
}
