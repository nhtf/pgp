import { User } from "./User";
import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	TableInheritance,
	AfterInsert,
	BeforeRemove,
} from "typeorm";
import { Expose, instanceToPlain } from "class-transformer";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Subject } from "src/enums/Subject";
import { Action } from "src/enums/Action";

@Entity()
@TableInheritance({ column : { type: "varchar", name: "type" } })
export class Invite {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn({ type: 'timestamptz' })
	date: Date;

	@ManyToOne(() => User, (user) => user.sent_invites, { onDelete: "CASCADE" })
	from: User;

	@ManyToOne(() => User, (user) => user.received_invites, { onDelete: "CASCADE" })
	to: User;

	@Expose()
	get type(): string {
		return "Room";
	}

	@AfterInsert()
	afterInsert() {
		UpdateGateway.instance.send_update({
			subject: Subject.INVITE,
			id: this.id,
			action: Action.ADD,
			value: instanceToPlain(this),
		}, this.from, this.to);
	}

	@BeforeRemove()
	beforeRemove() {
		UpdateGateway.instance.send_update({
			subject: Subject.INVITE,
			id: this.id,
			action: Action.REMOVE,
		}, this.from, this.to);
	}
}
