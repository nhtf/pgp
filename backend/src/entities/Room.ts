import { Entity, TableInheritance, PrimaryGeneratedColumn, Column, OneToMany, ChildEntity } from "typeorm";
import { Member } from "./Member";
import { User } from "./User";
import { Access } from "../Enums/Access";
import { Role } from "../Enums/Role";
import { Message } from "./Message";
import { Exclude, instanceToPlain } from "class-transformer";
import { RoomInvite } from "./RoomInvite";

@Entity()
@TableInheritance({ column : { type: "varchar", name: "type" } })
export class Room {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column()
	is_private: boolean;

	@Column({
		nullable: true
	})
	password: string | null;

	get access(): Access {
		if (this.is_private)
			return Access.PRIVATE;
		else if (this.password)
			return Access.PROTECTED;
		else
			return Access.PUBLIC;
	}

	@Exclude()
	@OneToMany(() => Member, (member) => member.room, { cascade: true })
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
	}

	async serialize() {
		return {
			...instanceToPlain(this),
			users: await Promise.all((await this.members).map((member) => member.user)),
		};
	}
}
