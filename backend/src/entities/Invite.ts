import { User } from "./User";
import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	TableInheritance,
} from "typeorm";
import { Exclude, instanceToPlain } from "class-transformer";

@Entity()
@TableInheritance({ column : { type: "varchar", name: "type" } })
export class Invite {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn()
	date: Date;

	@Exclude()
	@ManyToOne(() => User, (user) => user.sent_invites, { onDelete: "CASCADE" })
	from: Promise<User>;

	@Exclude()
	@ManyToOne(() => User, (user) => user.received_invites, { onDelete: "CASCADE" })
	to: Promise<User>;

	async serialize() {
		return {
			...instanceToPlain(this),
			from: await this.from,
			to: await this.to,
		}
	}
}
