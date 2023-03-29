import type { CreateRoomOptions } from "src/services/new.room.service";
import { GenericRoomController } from "src/controllers/new.room.controller";
import { IsString, Length, IsOptional, IsBoolean } from "class-validator";
import { ChatRoom } from "src/entities/ChatRoom";
import { ChatRoomMember } from "src/entities/ChatRoomMember";
import { ChatRoomService } from "src/services/chatroom.service";

class CreateRoomDTO implements CreateRoomOptions {
	@IsString()
	@Length(3, 20)
	name: string;

	@IsBoolean()
	@IsOptional()
	is_private?: boolean;

	@IsString()
	@IsOptional()
	@Length(1, 500)
	password?: string;
}

class EditRoomDTO implements Partial<CreateRoomOptions> {
	@IsString()
	@Length(3, 20)
	@IsOptional()
	name?: string;

	@IsBoolean()
	@IsOptional()
	is_private?: boolean;

	@IsString()
	@IsOptional()
	@Length(1, 500)
	password?: string;
}

export class NewChatRoomController extends GenericRoomController(
	ChatRoom,
	ChatRoomMember,
	CreateRoomDTO,
	EditRoomDTO,
	"chat"
) {

}
