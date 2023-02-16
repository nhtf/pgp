import { Room } from "./Room";
import { Team } from "./Team";
import { Expose } from "class-transformer";
import { ChildEntity, OneToOne, JoinColumn } from "typeorm";
import { Gamemode } from "src/enums/Gamemode";
import { GameState } from "./GameState";

@ChildEntity()
export class GameRoom extends Room {
	@OneToOne(() => GameState, (state) => state.room, { eager: true, cascade: [ "insert", "update" ] })
	state: GameState;

	@Expose()
	get gamemode(): Gamemode {
		return this.state?.gamemode;
	}

	set gamemode(gamemode: Gamemode) {
		this.state.gamemode = gamemode;
	}

	@Expose()
	get teams(): Team[] {
		return this.state?.teams;
	}

	set teams(teams: Team[]) {
		this.state.teams = teams;
	}

	@Expose()
	get teamsLocked(): boolean {
		return this.state?.teamsLocked;
	}

	set teamsLocked(teamsLocked: boolean) {
		this.state.teamsLocked = teamsLocked;
	}

	get type(): string {
		return "GameRoom";
	}
}
