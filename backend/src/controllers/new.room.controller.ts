import type { Room } from "src/entities/Room";
import type { User } from "src/entities/User";
import type { Member } from "src/entities/Member";
import { Controller, Inject, Get, Post, UseGuards, HttpCode, HttpStatus, UsePipes, ValidationPipe, Body, createParamDecorator, ExecutionContext, NotFoundException, UseInterceptors, ClassSerializerInterceptor } from "@nestjs/common";
import { HttpAuthGuard } from "src/auth/auth.guard";
import { SetupGuard } from "src/guards/setup.guard";
import { RolesGuard, RequiredRole } from "src/guards/role.guard";
import { Me } from "src/util";
import { Role } from "src/enums";
import { ERR_NOT_MEMBER, ERR_PERM, ERR_ROOM_NOT_FOUND } from "src/errors";
import { IRoomService, CreateRoomOptions } from "src/services/new.room.service";

export const GetRoom = createParamDecorator(
	async (where: undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();

		if (!request.room) {
			throw new NotFoundException(ERR_ROOM_NOT_FOUND);
		}

		return request.room;
	}
);

export function GenericRoomController<T extends Room, U extends Member, S extends CreateRoomOptions>(RoomType: (new () => T), DTOType: (new () => S)) {
	@UseGuards(HttpAuthGuard, SetupGuard, RolesGuard)
	@UseInterceptors(ClassSerializerInterceptor)
	@Controller("test")
	class RoomControllerFactory {

		constructor(
			@Inject(`${RoomType.toString().toUpperCase()}_SERVICE`)
			readonly room_service: IRoomService<T, U, S>,
		) {
		}

		@Get()
		async list_rooms() {
			return await this.room_service.get();
		}

		@Post()
		@HttpCode(HttpStatus.NO_CONTENT)
		@UsePipes(new ValidationPipe({ expectedType: DTOType }))
		async create_room(
			@Me() user: User,
			@Body() dto: S,
		) {
			const room = await this.room_service.create(dto);
		
			await this.room_service.add_members(room, { user, role: Role.OWNER });
			await this.room_service.save(room);
		}

		@Get(":id")
		@RequiredRole(Role.MEMBER)
		async get_room(
			@Me() me: User,
			@GetRoom() room: T,
		) {
			return room;
		}
	}
	return RoomControllerFactory;
}
