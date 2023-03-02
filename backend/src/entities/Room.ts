import { Entity, TableInheritance, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable, BeforeRemove } from "typeorm";
import { Member } from "./Member";
import { User } from "./User";
import { Access } from "../enums/Access";
import { Role } from "../enums/Role";
import { Exclude, Expose, instanceToPlain } from "class-transformer";
import { RoomInvite } from "./RoomInvite";
import { UpdateGateway, UpdatePacket } from "src/gateways/update.gateway";
import { Subject } from "src/enums/Subject";
import { Action } from "src/enums/Action";

@Entity()
@TableInheritance({ column : { type: "varchar", name: "type" } })
export class Room {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Exclude()
	@Column()
	is_private: boolean;

	@Exclude()
	@Column({
		nullable: true
	})
	password: string | null;

	@Exclude()
	@OneToMany(() => Member, (member) => member.room, { orphanedRowAction: "delete", cascade: true })
	members: Member[];

	self?: Member;
	joined?: boolean;

	@Exclude()
	@ManyToMany(() => User, (user) => user.banned_rooms)
	@JoinTable()
	banned_users: User[];

	@Exclude()
	@OneToMany(() => RoomInvite, (invite) => invite.room)
	invites: RoomInvite[];

	@Expose()
	get type(): string {
		return "Generic";
	}

	@Expose()
	get access(): Access {
		return this.is_private ? Access.PRIVATE : this.password ? Access.PROTECTED : Access.PUBLIC;
	}

	@Expose()
	get owner(): User {
		return this.members?.find(member => member.role === Role.OWNER)?.user;
	}

	get users(): User[] {
		return this.members?.map(member => member.user);
	}

	async send_update(packet: UpdatePacket, broadcast?: boolean) {
		if (broadcast === true) {
			await UpdateGateway.instance.send_update(packet);
		} else {
			await UpdateGateway.instance.send_update(packet, ...this.users);
		}
	}

	@BeforeRemove()
	async beforeRemove() {
		await this.send_update({
			subject: Subject.ROOM,
			id: this.id,
			action: Action.REMOVE,
			value: instanceToPlain(this),
		}, !this.is_private);
	}
}
