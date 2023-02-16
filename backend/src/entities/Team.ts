import { Exclude } from "class-transformer";
import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, Column } from "typeorm";
import { GameRoom } from "./GameRoom";
import { Player } from "./Player";

@Entity()
export class Team {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@ManyToOne(() => GameRoom, (room) => room.teams, { onDelete: "CASCADE" })
	room: GameRoom;

	@Exclude()
	@OneToMany(() => Player, (player) => player.team)
	players: Player[];

	@Column({ default: 0 })
	score: number = 0;
}
