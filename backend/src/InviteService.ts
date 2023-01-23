import { ClassSerializerInterceptor, Controller, Inject, UseGuards, UseInterceptors } from "@nestjs/common";
import { Repository } from "typeorm";
import { AuthGuard } from "./auth/auth.guard";
import { Invite } from "./entities/Invite";

export function GenericInviteController<T extends Invite>(type: (new () => T), route?: string) {
	@UseGuards(AuthGuard)
	@UseInterceptors(ClassSerializerInterceptor)
	@Controller(route || type.name.toString().toLowerCase())
	class RoomControllerFactory {
		constructor(
			@Inject(type.name.toString().toUpperCase() + "_REPO") readonly room_repo: Repository<T>) {}

	}

	return RoomControllerFactory;
}
