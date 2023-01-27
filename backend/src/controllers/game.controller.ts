import { GenericRoomController } from "src/services/room.service";
import { GameRoom } from "src/entities/GameRoom";

export class GameController extends GenericRoomController(GameRoom, "game") {}
