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
import { sessionMiddleware } from "./app.module";
import { IoAdapter } from "@nestjs/platform-socket.io";
import * as compression from "compression";

//TODO remove

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
		/*
		server.of("/room").on("connection", (socket) => {
			socket.on("disconnect", () => {
				console.log("disconnect");
			});
			console.log("connect");
		});
		*/
		return server;
	}
}


async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	//app.use(compression());
	app.use(sessionMiddleware);
	app.enableCors({
		origin: FRONTEND_ADDRESS,
		credentials: true,
	});
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			forbidUnknownValues: false, // TODO: true
			/*
			exceptionFactory: (e) => {
				throw new HttpException("bad request", HttpStatus.BAD_REQUEST);
			}*/
		}),
	);
	const betterAdapter = new BetterAdapter(app);
	app.useWebSocketAdapter(betterAdapter);

	app.useStaticAssets(join(__dirname, "..", "avatar"), { prefix: "/avatar/" });
	
	app.listen(BACKEND_PORT);
}
bootstrap();
