import { Column, Entity, RelationId, ManyToOne,PrimaryGeneratedColumn, TableInheritance } from "typeorm";
import { Room } from "./Room";
import { User } from "./User";
import { Exclude } from "class-transformer";
import { Role } from "src/enums";

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Member {
	@PrimaryGeneratedColumn()
	id: number;

	@Exclude()
	@ManyToOne(() => User, (user) => user.members, { eager: true, onDelete: "CASCADE" })
	user: User;

	@RelationId((member: Member) => member.user)
	userId: number;

	@ManyToOne(() => Room, { onDelete: "CASCADE", cascade: ["insert", "update"] })
	room: Room;

	@RelationId((member: Member) => member.room)
	roomId: number;

	@Column({
		type: "enum",
		enum: Role,
		default: Role.MEMBER,
	})
	role: Role;

	get type(): string {
		return "Member";
	}
}
