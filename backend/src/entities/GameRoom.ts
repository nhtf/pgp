import { Room } from "./Room";
import { ChildEntity, Column } from "typeorm";
import { Gamemode } from "src/enums/Gamemode";

@ChildEntity()
export class GameRoom extends Room {

	@Column()
	gamemode: Gamemode;

	get type(): string {
		return "GameRoom";
	}
}
