import { Room } from "./Room";
import { ChildEntity } from "typeorm";

@ChildEntity()
export class GameRoom extends Room {
	get type(): string {
		return "GameRoom";
	}
}
