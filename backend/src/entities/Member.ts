import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, AfterInsert, BeforeRemove } from "typeorm";
import { Room } from "./Room";
import { Role } from "src/enums/Role";
import { User } from "./User";
import { Exclude, instanceToPlain } from "class-transformer";
import { Message } from "./Message";
import { Subject } from "src/enums/Subject";
import { Action } from "src/enums/Action";
import { UpdateGateway } from "src/gateways/update.gateway";

@Entity()
export class Member {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, (user) => user.members, { onDelete: "CASCADE" })
	user: User;

	@ManyToOne(() => Room, { onDelete: "CASCADE", cascade: [ "insert", "update" ]})
	room: Room;

	@Column({
		type: "enum",
		enum: Role,
		default: Role.MEMBER,
	})
	role: Role;

	@Exclude()
	@OneToMany(() => Message, (message) => message.member)
	messages: Message[];

	@Column({
		nullable: true,
	})
	mute: Date | null;

	@AfterInsert()
	async afterInsert() {
		await UpdateGateway.instance.send_update({
			subject: Subject.MEMBER,
			identifier: this.id,
			action: Action.ADD,
			value: instanceToPlain(this),
		}, ...(this.room?.users || []));
	}

	@BeforeRemove()
	async beforeRemove() {
		await UpdateGateway.instance.send_update({
			subject: Subject.MEMBER,
			identifier: this.id,
			action: Action.REMOVE,
			value: instanceToPlain(this),
		}, ...(this.room?.users || []));
	}
}
