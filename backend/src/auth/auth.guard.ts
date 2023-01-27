import { Inject, Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Repository } from "typeorm";
import type { User } from '../entities/User';
import type { Request } from "express";

function GenericAuthGuard(get_request: (context: ExecutionContext) => Request) {
	@Injectable()
	class GenericAuthGuardFactory implements CanActivate {
		constructor(
			@Inject("USER_REPO")
			readonly user_repo: Repository<User>,
		) {}

		async canActivate(context: ExecutionContext): Promise<boolean> {
			const session = get_request(context)?.session;
			const id = session?.user_id;
			
			if (!id)
				return false;
			const user = await this.user_repo.findOneBy({ id });
			if (!user)
				return false;
			return user.auth_req === session.auth_level;
		}
	}
	return GenericAuthGuardFactory;
}

export class HttpAuthGuard extends GenericAuthGuard(context => context.switchToHttp().getRequest()) {}
export class WsAuthGuard extends GenericAuthGuard(context => context.switchToWs().getClient().getRequest()) {}
