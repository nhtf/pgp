import { Injectable, NestMiddleware } from "@nestjs/common";
import { ActivityGateway } from "../gateways/activity.gateway";

@Injectable()
export class ActivityMiddleware implements NestMiddleware {
	async use(req: any, res: any, next: (error?: any) => void) {
		if (req.user) {
			ActivityGateway.user_heartbeat(req.user);
		}
		next();
	}
}
