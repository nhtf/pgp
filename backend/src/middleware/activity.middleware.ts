import { Injectable, NestMiddleware } from "@nestjs/common";
import { ActivityService } from "../services/activity.service";

@Injectable()
export class ActivityMiddleware implements NestMiddleware {
	constructor(private readonly service: ActivityService) {}

	async use(req: any, res: any, next: (error?: any) => void) {
		if (req.user) {
			this.service.heartbeat(req.user);
		}
		next();
	}
}
