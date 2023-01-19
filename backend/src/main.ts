import * as dotenv from 'dotenv';
dotenv.config();
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
	FRONTEND_ADDRESS,
	BACKEND_PORT,
} from './vars';
import { join } from 'path';
import { sessionMiddleware } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

//https://docs.nestjs.com/websockets/adapter
//https://socket.io/get-started/chat
//https://socket.io/how-to/use-with-express-session
class BetterAdapter extends IoAdapter {
	createIOServer(port: number, options: any = {}):any {
		const server = super.createIOServer(port, options);
		const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
		server.use(wrap(sessionMiddleware));
		server.of('/room').use(wrap(sessionMiddleware));
		return server;
	}
}


async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
        app.use(sessionMiddleware);
        /*
	app.use(
		session({
			store: new (require('connect-pg-simple')(session))({
				//TODO this is probably not the right way to connect to the database for sessions
				conString: 'postgres://postgres:postgres@localhost:5432/dev',
				createTableIfMissing: true,
			}),
			secret: SESSION_SECRET,
			resave: true,
			saveUninitialized: false,
			cookie: {
				maxAge: 72000000, //TODO set the right maxAge
				sameSite: 'strict',
			},
		}),
	);
       */
	app.enableCors({
		origin: FRONTEND_ADDRESS,
		credentials: true,
	});
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
		}),
	);

	const betterAdapter = new BetterAdapter(app);
	app.useWebSocketAdapter(betterAdapter);

	app.useStaticAssets(join(__dirname, '..', 'avatar'), { prefix: '/avatar/' });
	//TODO use nestjs way of setting up the data sourcd
	app.listen(BACKEND_PORT);
}
bootstrap();
