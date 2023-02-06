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
			return authenticate(get_request(context)?.session, this.user_repo);
		}
	}
	return GenericAuthGuardFactory;
}

export class HttpAuthGuard extends GenericAuthGuard(context => context.switchToHttp().getRequest()) {}
