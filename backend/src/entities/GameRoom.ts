import { ChildEntity, OneToOne } from "typeorm";
import { Expose } from "class-transformer";
import { GameState } from "./GameState";
import { Room } from "./Room";

@ChildEntity()
export class GameRoom extends Room {
	@OneToOne(() => GameState, (state) => state.room, { eager: true, cascade: [ "insert", "update" ] })
	state: GameState;

	@Expose()
	get type(): string {
		return "GameRoom";
	}
}
