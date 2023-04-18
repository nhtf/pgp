import { Inject, Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Repository } from "typeorm";
import { User } from "../entities/User";
import type { Request } from "express";
import { AuthDTO } from "src/util";
import { plainToClass } from "class-transformer";
import * as argon2 from "argon2";

function GenericAuthGuard(get_request: (context: ExecutionContext) => Request) {
	@Injectable()
	class GenericAuthGuardFactory implements CanActivate {
		constructor(
			@Inject("USER_REPO")
			readonly user_repo: Repository<User>,
		) { }

		async canActivate(context: ExecutionContext): Promise<boolean> {
			const request = get_request(context);
			const user = request?.user;
			const session = request?.session;

			if (!user)
				return false;
			if (request.headers.authorization) {
				//auth header is already checked in middleware, so no validation is done here
				if (await argon2.verify(
					user.api_secret,
					Buffer.from(plainToClass(AuthDTO,
						JSON.parse(Buffer.from(request.headers.authorization, "base64").toString())).secret, "base64")))
					return true;
				return false;
			}
			return (session && session.auth_level >= user.auth_req);
		}
	}
	return GenericAuthGuardFactory;
}

export class HttpAuthGuard extends GenericAuthGuard(context => context.switchToHttp().getRequest()) { }
