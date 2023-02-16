import { GenericRoomController, CreateRoomDTO } from "src/services/room.service";
import { GameRoom } from "src/entities/GameRoom";
import { IsEnum } from "class-validator";
import { Gamemode } from "src/enums/Gamemode";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { GameState } from "src/entities/GameState";
import { Team } from "src/entities/Team";

class CreateGameRoomDTO extends CreateRoomDTO {
	@IsEnum(Gamemode)
	gamemode: Gamemode;
}

//TODO add gamemode type
export class GameController extends GenericRoomController<GameRoom, GameRoomMember>(GameRoom, GameRoomMember, "game", CreateGameRoomDTO) {

	async setup_room(room: GameRoom, dto: CreateGameRoomDTO) {
		const teamOne = new Team();
		const teamTwo = new Team();

		room.state = new GameState();
		room.teams = [teamOne, teamTwo];
		room.gamemode = dto.gamemode;
	}
}
