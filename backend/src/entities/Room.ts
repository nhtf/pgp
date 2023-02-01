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
	get access(): Access {
		if (this.is_private)
			return Access.PRIVATE;
		else if (this.password)
			return Access.PROTECTED;
		else
			return Access.PUBLIC;
	}

	@OneToMany(() => Member, (member) => member.room, { orphanedRowAction: "delete", cascade: true })
	members: Member[];

	@ManyToMany(() => User)
	@JoinTable()
	banned_users: User[];

	@OneToMany(() => RoomInvite, (invite) => invite.room)
	invites: RoomInvite[];

	/*
	 * @deprecated this function was meant for loading all the lazy relations, but it turns out that
	 * lazy relations are experimental and honestly a pain in the ass
	 */
	async serialize() {
		const members = await Promise.all((await this.members).map(member => member.serialize()));
		const invites = await Promise.all((await this.invites).map(invite => invite.serialize()));
		const owner = members.find((member) => member.role === Role.OWNER);
	
		if (!owner) {
			console.log("Missing owner", this);
			await fetch(`${BACKEND_ADDRESS}/debug/room/delete?id=${this.id}`);
			return {};
		}
	
		const ret = {
			id: this.id,
			name: this.name,
			private: this.is_private,
			owner: await owner.user,
			members: members,
			invites: invites,
			banned_users: await this.banned_users,
		};
		console.log(ret);
		return ret;
	}
}
