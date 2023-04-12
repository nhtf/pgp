import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { Gamemode } from "src/enums";
import { User } from "./User";

@Entity()
export class GameQueue {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	gamemode: Gamemode;

	@Column()
	player_count: number;

	@ManyToMany(() => User, { onDelete: "CASCADE", eager: true })
	@JoinTable({ name: "queue" })
	users: User[];
}
