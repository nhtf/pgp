import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	OneToMany,
	Column,
	RelationId,
	BeforeRemove,
} from "typeorm";
import { ChatRoom } from "./ChatRoom";
import { User } from "./User";
import { ChatRoomMember } from "./ChatRoomMember";
import { Embed } from "./Embed";
import { Exclude, Transform } from "class-transformer"
import { Subject } from "src/enums/Subject"
import { Action } from "src/enums/Action"

@Entity()
export class Message {
	@PrimaryGeneratedColumn()
	id: number;

	@Transform(({ value }) => value.getTime())
	@CreateDateColumn({ type: 'timestamptz' })
	created: Date;

	@Column()
	content: string;
	
	@Exclude()
	@ManyToOne(() => ChatRoom, (room) => room.messages, { onDelete: "CASCADE" })
	room: ChatRoom;
	
	@Exclude()
	@ManyToOne(() => ChatRoomMember, (member) => member.messages, { nullable: true, onDelete: "SET NULL" })
	member: ChatRoomMember | null;

	@RelationId((message: Message) => message.member)
	memberId: number

	@Exclude()
	@ManyToOne(() => User, (user) => user.messages, { onDelete: "CASCADE" })
	user: User;

	@RelationId((message: Message) => message.user)
	userId: number;
	
	@OneToMany(() => Embed, (embed) => embed.message, { eager: true, cascade: true })
	embeds: Embed[];

	@BeforeRemove()
	beforeRemove() {
		this.room.send_update({
			subject: Subject.MESSAGE,
			action: Action.REMOVE,
			id: this.id,
		});
	}
}
