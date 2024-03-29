import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, Column, RelationId } from "typeorm";
import { GameState } from "./GameState";
import { Player } from "./Player";

@Entity()
export class Team {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@ManyToOne(() => GameState, (state) => state.teams, { onDelete: "CASCADE" })
	state: GameState;

	@RelationId((team: Team) => team.state)
	stateId: number;

	@OneToMany(() => Player, (player) => player.team, { eager: true })
	players: Player[];

	@Column({ default: 0 })
	score: number = 0;
}
