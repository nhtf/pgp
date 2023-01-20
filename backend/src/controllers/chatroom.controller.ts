import { GenericRoomController } from "src/RoomService";
import { ChatRoom } from "src/entities/ChatRoom";

export class ChatRoomController extends GenericRoomController(ChatRoom, "room(s)?") {}
