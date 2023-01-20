import { ClassSerializerInterceptor, Controller, createParamDecorator, ExecutionContext, UseGuards, UseInterceptors } from "@nestjs/common";
import { GenericRoomController } from "src/RoomService";
import { ChatRoom } from "src/entities/ChatRoom";

export const GetMember = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		return ctx.switchToHttp().getRequest().member;
	}
);

export const GetRoom = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		return ctx.switchToHttp().getRequest().room;
	}
);

export class ChatRoomController extends GenericRoomController(ChatRoom, "room(s)?") {
	// @Get()
	// async userRooms(@Request() request) {
	// 	const user = request.user;
	// 	const members = await user.members;
	// 	const rooms = await Promise.all(members.map((member) => member.room));
	
	// 	return await Promise.all(rooms.map((room) => room));
	// }

	// @Get(":id")
	// async room(@GetRoom() room: Room) {
	// 	return room;
	// }

	// @Post()
	// async create(
	// 	@Me() user: User,
	// 	@Body("name") name: string,
	// 	@Body("private", ParseBoolPipe) is_private: boolean,
	// 	@Body("pasword") password?: string
	// ) {
	// 	if (!name) {
	// 		throw new BadRequestException("missing room name");
	// 	}
	
	// 	if (await this.roomRepo.findOneBy({ name })) {
	// 		throw new UnprocessableEntityException("a room with this name already exists");
	// 	}

	// 	const room = new Room;
	// 	const member = user.toMember(room);

	// 	room.name = name;
	// 	room.members = Promise.resolve([member]);
	// 	room.is_private = is_private;

	// 	if (password) {
	// 		room.password = await argon2.hash(password);
	// 	}

	// 	await this.roomRepo.save(room);

	// 	return {};
	// }

	// @Delete(":id")
	// async delete(@GetMember() member: Member, @GetRoom() room: Room) {
	// 	if (member.role !== Role.OWNER) {
	// 		throw new HttpException("Not room owner", HttpStatus.UNAUTHORIZED);
	// 	}

	// 	return await this.roomRepo.remove(room);
	// }
}
