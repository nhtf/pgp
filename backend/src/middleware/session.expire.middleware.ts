import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request } from "express";
import { SessionService } from "src/services/session.service";

@Injectable()
export class SessionExpiryMiddleware implements NestMiddleware {
	constructor(private readonly service: SessionService) {}
	async use(req: Request, res: any, next: (error?: any) => void) {
		await this.service.heartbeat(req);
	
		next();
	}
}
