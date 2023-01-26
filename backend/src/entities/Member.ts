import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Room } from "./Room";
import { Role } from "src/enums/Role";
import { User } from "./User";
import { Exclude, instanceToPlain } from "class-transformer";
import { Message } from "./Message";

@Entity()
export class Member {
	@PrimaryGeneratedColumn()
	id: number;

	@Exclude()
	@ManyToOne(() => User, (user) => user.members, { onDelete: "CASCADE" })
	user: Promise<User>;

	@Exclude()
	@ManyToOne(() => Room, { onDelete: "CASCADE" })
	room: Promise<Room>;

	@Column({
		type: "enum",
		enum: Role,
		default: Role.MEMBER,
	})
	role: Role;

	@Exclude()
	@OneToMany(() => Message, (message) => message.member)
	messages: Promise<Message[]>;

	async serialize() {
		return {
			...instanceToPlain(this),
			user: await this.user,
		};
	}
}
