import { Entity, TableInheritance, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Member } from "./Member";
import { User } from "./User";
import { Access } from "../enums/Access";
import { Role } from "../enums/Role";
import { Exclude, Expose, instanceToPlain } from "class-transformer";
import { RoomInvite } from "./RoomInvite";

import { HttpException, HttpStatus } from "@nestjs/common"; // TODO

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
	get access(): Access {
		if (this.is_private)
			return Access.PRIVATE;
		else if (this.password)
			return Access.PROTECTED;
		else
			return Access.PUBLIC;
	}

	@Exclude()
	@OneToMany(() => Member, (member) => member.room, { orphanedRowAction: "delete", onUpdate: "CASCADE" })
	members: Promise<Member[]>;

	@Exclude()
	@OneToMany(() => RoomInvite, (invite) => invite.room)
	invites: Promise<RoomInvite[]>;

	async add_member(user: User, role?: Role) {
		const member = new Member();
	
		member.user = Promise.resolve(user);
		member.room = Promise.resolve(this);
		member.role = role || Role.MEMBER;

		const members = await this.members;
		if (members)
			members.push(member);
		else
			this.members = Promise.resolve([member]);
		return member;
	}

	async serialize() {
		const members = await this.members;
		const owner = members.find((member) => member.role === Role.OWNER);

		if (!owner) {
			throw new HttpException(String(this.id), HttpStatus.I_AM_A_TEAPOT);
		}
	
		return {
			...instanceToPlain(this),
			members: await Promise.all((members).map((member) => member.serialize())),
			invites: await Promise.all((await this.invites).map((invite) => invite.serialize())),
			owner: await owner.user,
		};
	}
}
