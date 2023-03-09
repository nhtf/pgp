import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, Column } from "typeorm";
import { GameState } from "./GameState";
import { Player } from "./Player";

@Entity()
export class Team {
	constructor(name?: string) {
		this.name = name ?? null;
	}

	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@ManyToOne(() => GameState, (state) => state.teams, { onDelete: "CASCADE" })
	state: GameState;

	@OneToMany(() => Player, (player) => player.team)
	players: Player[];

	@Column({ default: 0 })
	score: number = 0;
}
