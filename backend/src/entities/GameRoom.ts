import { Room } from "./Room";
import { Team } from "./Team";
import { Expose } from "class-transformer";
import { ChildEntity, OneToOne } from "typeorm";
import { Gamemode } from "src/enums";
import { GameState } from "./GameState";

@ChildEntity()
export class GameRoom extends Room {
	@OneToOne(() => GameState, (state) => state.room, { eager: true, cascade: [ "insert", "update" ] })
	state: GameState;

	@Expose()
	get teams(): Team[] {
		return this.state?.teams;
	}

	set teams(teams: Team[]) {
		this.state.teams = teams;
	}

	@Expose()
	get type(): string {
		return "GameRoom";
	}
}
