import { Inject, HttpException, HttpStatus, Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { User } from "src/entities/User";
import { Repository } from "typeorm"
import type { Request, Response } from "express";
import isJWT from "validator/lib/isJWT";
import * as jwt from "jsonwebtoken";
import { AUTH_SECRET } from "src/vars";

@Injectable()
export class UserMiddleware implements NestMiddleware {
	constructor(@Inject("USER_REPO") private readonly userRepo: Repository<User>) {}

	async use(request: Request, response: Response, next: (error?: any) => void) {
		const session = request?.session;

		let id = session?.user_id;
		if (request.headers.authorization) {
			try {
				const token = request.headers.authorization;

				if (!token || !isJWT(token))
					return null;
				const data = jwt.verify(token, AUTH_SECRET);
				id = data["id"];
			} catch (error) {
				throw new UnauthorizedException(error);
			}
		}

		if (id) {
			request.user = await this.userRepo.findOne({
				where: {
					id,
				},
				relations: {
					owner: true,
				},
			});
		}
	
		next();
	}
}
