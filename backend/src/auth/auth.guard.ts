import { Inject, Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Repository } from "typeorm";
import type { User } from "../entities/User";
import type { Request } from "express";
import type { SessionObject } from "src/services/session.service";

export async function authenticate(session: SessionObject, user_repo: Repository<User>): Promise<boolean> {
	const id = session?.user_id;

	if (!id)
		return false;
	const user = await user_repo.findOneBy({ id });
	if (!user)
		return false;
	return user.auth_req === session.auth_level;
}

function GenericAuthGuard(get_request: (context: ExecutionContext) => Request) {
	@Injectable()
	class GenericAuthGuardFactory implements CanActivate {
		constructor(
			@Inject("USER_REPO")
			readonly user_repo: Repository<User>,
		) {}

		async canActivate(context: ExecutionContext): Promise<boolean> {
			return authenticate(get_request(context)?.session, this.user_repo);
		}
	}
	return GenericAuthGuardFactory;
}

export class HttpAuthGuard extends GenericAuthGuard(context => context.switchToHttp().getRequest()) {}
