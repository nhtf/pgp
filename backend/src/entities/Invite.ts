import { User } from "./User";
import {
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	TableInheritance,
} from "typeorm";
import { Expose } from "class-transformer";

@Entity()
@TableInheritance({ column : { type: "varchar", name: "type" } })
export class Invite {
	@PrimaryGeneratedColumn()
	id: number;

	@CreateDateColumn({ type: 'timestamptz' })
	date: Date;

	@ManyToOne(() => User, (user) => user.sent_invites, { eager: true, onDelete: "CASCADE" })
	from: User;

	@ManyToOne(() => User, (user) => user.received_invites, { eager: true, onDelete: "CASCADE" })
	to: User;

	@Expose()
	get type(): string {
		return "Invite";
	}
}
