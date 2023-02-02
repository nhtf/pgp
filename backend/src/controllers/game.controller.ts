import { GenericRoomController, CreateRoomDTO } from "src/services/room.service";
import { GameRoom } from "src/entities/GameRoom";
import { IsEnum } from "class-validator";

enum GameMode {
	VR,
	REGULAR,
}

class CreateGameRoomDTO extends CreateRoomDTO {
	@IsEnum(GameMode)
	gamemode: GameMode;
}

//TODO add gamemode type
export class GameController extends GenericRoomController(GameRoom, "game") {

}
