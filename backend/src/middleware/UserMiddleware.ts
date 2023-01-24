import { HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { dataSource } from "src/app.module";
import { User } from "src/entities/User";

@Injectable()
export class UserMiddleware implements NestMiddleware {
	async use(req: any, res: any, next: (error?: any) => void) {
		if (!req.session.user_id) {
			throw new HttpException("User Middleware: Unauthorized", HttpStatus.UNAUTHORIZED); // TODO
		}
	
		req.user = await dataSource.getRepository(User).findOneBy({
			id: req.session.user_id
		});

		next();
	}
}
