import { Entity, TableInheritance, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { Member } from "./Member";
import { User } from "./User";
import { Access } from "../enums/Access";
import { Role } from "../enums/Role";
import { Exclude, Expose, instanceToPlain } from "class-transformer";
import { RoomInvite } from "./RoomInvite";
import { HttpException, HttpStatus } from "@nestjs/common";
import { BACKEND_ADDRESS } from "src/vars";

@Entity()
@TableInheritance({ column : { type: "varchar", name: "type" } })
export class Room {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column()
	is_private: boolean;

	@Exclude()
	@Column({
		nullable: true
	})
	password: string | null;

	@Expose()
	get owner(): User {
		return this.members?.find(member => member.role === Role.OWNER)?.user;
	}

	@Expose()
	get type(): string {
		return "Generic";
	}

	@Expose()
	get access(): Access {
		if (this.is_private)
			return Access.PRIVATE;
		else if (this.password)
			return Access.PROTECTED;
		else
			return Access.PUBLIC;
	}

	@Exclude()
	@OneToMany(() => Member, (member) => member.room, { orphanedRowAction: "delete", cascade: true })
	members: Member[];

	@ManyToMany(() => User)
	@JoinTable()
	banned_users: User[];

	@OneToMany(() => RoomInvite, (invite) => invite.room)
	invites: RoomInvite[];
}
