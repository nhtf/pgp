import { Injectable, Inject, NestMiddleware } from "@nestjs/common";
import type { User } from "src/entities/User";
import { Repository } from "typeorm";
import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
	windowMs: 1000,
	max: 1,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (request: Request, response: Response) => request.user?.id.toString() || request.ip,
});

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
	constructor(@Inject("USER_REPO") private readonly userRepo: Repository<User>) {}

	async use(request: Request, response: Response, next: (error?: any) => void) {
		limiter(request, response, next);
	}
}
