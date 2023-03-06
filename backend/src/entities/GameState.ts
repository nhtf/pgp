import { Team } from "./Team";
import { Exclude } from "class-transformer";
import { Column, OneToMany, OneToOne, PrimaryGeneratedColumn, Entity, JoinColumn } from "typeorm";
import { Gamemode } from "src/enums/Gamemode";
import { GameRoom } from "./GameRoom";

@Entity()
export class GameState {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	gamemode: Gamemode;

	@OneToMany(() => Team, (team) => team.state, { cascade: [ "insert", "update" ] })
	teams: Team[];

	@Column({ default: false })
	teamsLocked: boolean = false;

	@OneToOne(() => GameRoom, (room) => room.state, { nullable: true, onDelete: "SET NULL" })
	@JoinColumn()
	room: GameRoom | null;
}
