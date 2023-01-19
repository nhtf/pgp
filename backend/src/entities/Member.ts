import { Column, Entity, OneToOne, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Room } from "./Room";
import { Role } from "src/Enums/Role";
import { User } from "./User";

@Entity()
export class Member {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, (user) => user.members)
	user: Promise<User>;

	@ManyToOne(() => Room)
	room: Promise<Room>;

	@Column({
		nullable: true,
	})
	role: Role;
}
