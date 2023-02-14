import { Injectable, NestMiddleware } from "@nestjs/common";
import { UpdateGateway } from "src/gateways/update.gateway";

@Injectable()
export class ActivityMiddleware implements NestMiddleware {
	constructor(private readonly service: UpdateGateway) {}

	async use(req: any, res: any, next: (error?: any) => void) {
		if (req.user) {
			await this.service.heartbeat(req.user);
		}
	
		next();
	}
}
