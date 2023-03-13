import { Inject, Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Repository } from "typeorm";
import { User } from "../entities/User";
import type { Request } from "express";
import type { SessionObject } from "src/services/session.service";
import { authenticate } from "./authenticate";
import { InjectRepository } from "@nestjs/typeorm";

function GenericAuthGuard(get_request: (context: ExecutionContext) => Request) {
	@Injectable()
	class GenericAuthGuardFactory implements CanActivate {
		constructor(
			@Inject("USER_REPO")
			readonly user_repo: Repository<User>,
		) {}

		async canActivate(context: ExecutionContext): Promise<boolean> {
			const request = get_request(context);
			const user = request?.user;
			const session = request?.session;

			if (!user)
				return false;
			// console.log(user);
			if (!user.owner)
				return (session && session.auth_level >= user.auth_req);
			return true; /* user is bot */
		}
	}
	return GenericAuthGuardFactory;
}

export class HttpAuthGuard extends GenericAuthGuard(context => context.switchToHttp().getRequest()) {}
