import { Entity, TableInheritance, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable, AfterInsert, AfterRemove } from "typeorm";
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
		return this.is_private ? Access.PRIVATE : this.password ? Access.PROTECTED : Access.PUBLIC;
	}

	@Exclude()
	@OneToMany(() => Member, (member) => member.room, { orphanedRowAction: "delete", cascade: true })
	members: Member[];

	get users(): User[] {
		return this.members?.map(member => member.user);
	}

	@ManyToMany(() => User, (user) => user.banned_rooms)
	@JoinTable()
	banned_users: User[];

	@OneToMany(() => RoomInvite, (invite) => invite.room)
	invites: RoomInvite[];

	async send_update(packet: UpdatePacket) {
		if (this.is_private) {
			await UpdateGateway.instance.send_update(packet, ...(this.users || []));
		} else {
			await UpdateGateway.instance.send_update(packet);
		}
	}

	@AfterInsert()
	async afterInsert() {
		await this.send_update({
			subject: Subject.ROOM,
			identifier: this?.id,
			action: Action.ADD,
			value: instanceToPlain(this),
		});
	}

	@AfterRemove()
	async afterRemove() {
		await this.send_update({
			subject: Subject.ROOM,
			identifier: this.id,
			action: Action.REMOVE,
			value: instanceToPlain(this),
		});
	}
}
