import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class SessionExpiryMiddlware implements NestMiddleware {
	async use(req: Request, res: any, next: (error?: any) => void) {
		//await this.service.heartbeat(req.session);
		next();
	}
}
