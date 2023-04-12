import * as dotenv from "dotenv";
dotenv.config();
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { HttpException, HttpStatus, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import {
	FRONTEND_ADDRESS,
	BACKEND_PORT,
} from "./vars";
import { join } from "path";
import { dataSource, sessionMiddleware } from "./app.module";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Achievement } from "src/entities/Achievement";
import { Objective } from "src/entities/Objective";
import { achievements } from "src/achievements";

//https://docs.nestjs.com/websockets/adapter
//https://socket.io/get-started/chat
//https://socket.io/how-to/use-with-express-session
class BetterAdapter extends IoAdapter {
	createIOServer(port: number, options: any = {}):any {
		const server = super.createIOServer(port, options);
		const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
		server.use(wrap(sessionMiddleware));
		server.of("/room").use(wrap(sessionMiddleware));
		server.of("/game").use(wrap(sessionMiddleware));
		server.of("/update").use(wrap(sessionMiddleware));
		return server;
	}
}

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	app.use(sessionMiddleware);
	app.enableCors({
		origin: FRONTEND_ADDRESS,
		credentials: true,
	});
	app.useGlobalPipes(
		new ValidationPipe({
			transform: false, // TODO: true
			forbidUnknownValues: false, // TODO: true
		}),
	);
	const betterAdapter = new BetterAdapter(app);
	app.useWebSocketAdapter(betterAdapter);

	app.useStaticAssets(join(__dirname, "..", "avatar"), { prefix: "/avatar/" });

	const repo = dataSource.getRepository(Achievement);
	const tmp = await repo.find();
	const missing = achievements.filter((value) => !tmp.find((x) => x.name === value.name));
	await repo.save(missing.map((value) => {
		const achievement = new Achievement();

		achievement.name = value.name;
		achievement.max = value.max;
		achievement.image = value.image;

		achievement.objectives = value.objectives.map((obj) => {
			const objective = new Objective();

			objective.threshold = obj.threshold;
			objective.color = obj.color;
			objective.description = obj.description;
			objective.name = obj.name;
			return objective;
		});

		return achievement;
	}));
	
	await app.listen(BACKEND_PORT);
}
bootstrap();
