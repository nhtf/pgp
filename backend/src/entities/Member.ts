import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Room } from "./Room";
import { Role } from "src/enums/Role";
import { User } from "./User";
import { Exclude, instanceToPlain } from "class-transformer";
import { Message } from "./Message";

@Entity()
export class Member {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, (user) => user.members, { onDelete: "CASCADE" })
	user: User;

	@ManyToOne(() => Room, { onDelete: "CASCADE", cascade: [ "insert", "update" ]})
	room: Room;

	@Column({
		type: "enum",
		enum: Role,
		default: Role.MEMBER,
	})
	role: Role;

	@Exclude()
	@OneToMany(() => Message, (message) => message.member)
	messages: Message[];
}
