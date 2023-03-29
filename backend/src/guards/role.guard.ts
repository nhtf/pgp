import { Injectable, CanActivate, ExecutionContext, NotFoundException, ForbiddenException, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ERR_PERM, ERR_ROOM_NOT_FOUND } from "src/errors";
import { Role } from "src/enums"

const ROLE_KEY = "PGP_ROLES";
@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) { }

	canActivate(context: ExecutionContext): boolean {
		const role = this.reflector.get<Role>(ROLE_KEY, context.getHandler());
		if (role === undefined)
			return true;
		const request = context.switchToHttp().getRequest();
		const room = request.room;
		const member = request.member;
		if (!room || (!member && room.is_private)) {
			throw new NotFoundException(ERR_ROOM_NOT_FOUND);
		}
		if (role === null) {
			if (member)
				throw new ForbiddenException("Already a member");
			return true;
		}
		if (!member || member?.role < role) {
			throw new ForbiddenException(ERR_PERM);
		}
		return true;
	}
}

export const RequiredRole = (role: Role) => SetMetadata(ROLE_KEY, role);
