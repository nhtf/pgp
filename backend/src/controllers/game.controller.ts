import { GenericRoomController, CreateRoomDTO } from "src/services/room.service";
import { GameRoom } from "src/entities/GameRoom";
import { IsEnum } from "class-validator";
import { Gamemode } from "src/enums/Gamemode";
import { GameRoomMember } from "src/entities/GameRoomMember";

class CreateGameRoomDTO extends CreateRoomDTO {
	@IsEnum(Gamemode)
	gamemode: Gamemode;
}

//TODO add gamemode type
export class GameController extends GenericRoomController<GameRoom, GameRoomMember>(GameRoom, GameRoomMember, "game", CreateGameRoomDTO) {

	async setup_room(room: GameRoom, dto: CreateGameRoomDTO) {
		room.gamemode = dto.gamemode;
	}
}
