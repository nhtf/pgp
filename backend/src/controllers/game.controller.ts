import { GenericRoomController } from 'src/RoomService';
import { GameRoom } from 'src/entities/GameRoom';

export class GameController extends GenericRoomController(GameRoom, "game") {}
