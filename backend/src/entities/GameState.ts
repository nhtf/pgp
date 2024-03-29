import { Team } from "./Team";
import { Column, OneToMany, OneToOne, PrimaryGeneratedColumn, Entity, JoinColumn, RelationId } from "typeorm";
import { Exclude } from "class-transformer"
import { Gamemode } from "src/enums";
import { GameRoom } from "./GameRoom";

@Entity()
export class GameState {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	gamemode: Gamemode;

	@Exclude()
	@OneToOne(() => GameRoom, (room) => room.state, { nullable: true, onDelete: "SET NULL" })
	@JoinColumn()
	room: GameRoom | null;

	@RelationId((gameState: GameState) => gameState.room)
	roomId: number | null;

	@Column()
	team_count: number;

	@OneToMany(() => Team, (team) => team.state, { eager: true, cascade: [ "insert", "update" ] })
	teams: Team[];

	@Column({ default: false })
	teamsLocked: boolean;

	@Column({ default: false })
	finished: boolean = false;

	@Exclude()
	@Column({ default: false })
	terminated: boolean = false;

	@Column({ default: false })
	ranked: boolean = false;
}
