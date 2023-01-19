import { Entity, TableInheritance, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Member } from "./Member";
import { Access } from "../Enums/Access";

@Entity()
@TableInheritance({ column : { type: "varchar", name: "type" } })
export class Room {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column()
	is_private: boolean;

	@Column({
		nullable: true
	})
	password: string | null;

	get access(): Access {
		if (this.is_private)
			return Access.PRIVATE;
		else if (this.password)
			return Access.PROTECTED;
		else
			return Access.PUBLIC;
	}

	@OneToMany(() => Member, (member) => member.room)
	members: Promise<Member[]>;
}
