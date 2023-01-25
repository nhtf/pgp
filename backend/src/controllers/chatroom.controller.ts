import { GenericRoomController } from "src/services/room.service";
import { ChatRoom } from "src/entities/ChatRoom";

export class ChatRoomController extends GenericRoomController(ChatRoom, "room(s)?") {}
