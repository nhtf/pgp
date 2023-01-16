import { Column, Entity, OneToOne } from "typeorm";
import { User } from "./User";

export enum Role {
	OWNER = "owner",
	ADMIN = "admin",
	MEMBER = "member",
}

@Entity()
class Member {
	@OneToOne(() => User)
	@Column()
	user: Promise<User>

	@Column()
	role: Role
}