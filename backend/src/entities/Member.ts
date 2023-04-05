import { Column, Entity, RelationId, ManyToOne,PrimaryGeneratedColumn, TableInheritance } from "typeorm";
import { Room } from "./Room";
import { User } from "./User";
import { Exclude, Expose } from "class-transformer";
import { Role } from "src/enums";

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Member {
	@PrimaryGeneratedColumn()
	id: number;

	@Exclude()
	@ManyToOne(() => User, (user) => user.members, { eager: true, onDelete: "CASCADE", nullable: false })
	user: User;

	@RelationId((member: Member) => member.user)
	userId: number;

	@Exclude()
	@ManyToOne(() => Room, { onDelete: "CASCADE", cascade: ["insert", "update"], nullable: false })
	room: Room;

	@RelationId((member: Member) => member.room)
	roomId: number;

	@Column({ default: Role.MEMBER })
	role: Role;

	@Expose()
	get type(): string {
		return "Member";
	}
}
