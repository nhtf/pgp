import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Room } from "./Room";
import { Role } from "src/enums/Role";
import { User } from "./User";
import { Exclude, instanceToPlain } from "class-transformer";

@Entity()
export class Member {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Exclude()
	@ManyToOne(() => User, (user) => user.members, { onDelete: "CASCADE" })
	user: Promise<User>;

	@Exclude()
	@ManyToOne(() => Room, { onDelete: "CASCADE" })
	room: Promise<Room>;

	@Column({
		nullable: true,
	})
	role: Role;

	async serialize() {
		return {
			...instanceToPlain(this),
			user: await this.user
		};
	}
}
