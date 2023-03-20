import { Entity, TableInheritance, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { Member } from "./Member";
import { User } from "./User";
import { Access, Role } from "src/enums";
import { Exclude, Expose, instanceToPlain } from "class-transformer";
import { RoomInvite } from "./RoomInvite";
import { UpdateGateway, UpdatePacket } from "src/gateways/update.gateway";

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
	@OneToMany(() => Member, (member) => member.room, { eager: true, cascade: true, orphanedRowAction: "delete" })
	members: Member[];

	@Exclude()
	@ManyToMany(() => User, (user) => user.banned_rooms)
	@JoinTable()
	banned_users: User[];

	@Exclude()
	@OneToMany(() => RoomInvite, (invite) => invite.room)
	invites: RoomInvite[];

	@Expose()
	get type(): string {
		return "Room";
	}

	@Expose()
	get access(): Access {
		return this.is_private ? Access.PRIVATE : this.password ? Access.PROTECTED : Access.PUBLIC;
	}

	@Expose()
	get owner(): any {
		return instanceToPlain(this.members?.find((member) => member.role === Role.OWNER)?.user);
	}

	get users(): User[] {
		return this.members?.map(member => member.user);
	}

	self(user: User): any {
		return instanceToPlain(this.members?.find((member) => member.userId === user.id));
	}

	send_update(packet: UpdatePacket) {
		const receivers = this.is_private ? this.users : [];
		
		UpdateGateway.instance.send_update(packet, ...receivers);
	}
}
