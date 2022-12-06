import * as dotenv from 'dotenv';
dotenv.config();
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User, FriendRequest } from './UserService';
import * as session from 'express-session';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HOST, FRONTEND_ADDRESS, BACKEND_PORT, DB_PORT, DB_USER, DB_PASS, SESSION_SECRET } from './vars';
import { join } from 'path';

/*
export const data_source = new DataSource({
	type: 'postgres',
	host: HOST,
	port: DB_PORT,
	//TODO use env variables here
	username: DB_USER,
	password: DB_PASS,
	database: 'dev',
	entities: [User, FriendRequest],
	synchronize: true,
	logging: false,
});
*/

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
		app.use(
			session({
				store: new (require('connect-pg-simple')(session))({
					//TODO this is probably not the right way to connect to the database for sessions
					conString: 'postgres://postgres:postgres@localhost:5432/dev',
					createTableIfMissing: true
				}),
				secret: SESSION_SECRET,
				resave: true,
				saveUninitialized: false,
				cookie: {
					maxAge: 72000000, //TODO set the right maxAge
					sameSite: 'strict'
				}
			}),
		);
	app.enableCors({
		      'origin': FRONTEND_ADDRESS,
		      'credentials': true
	});
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
		})
	);

	app.useStaticAssets(join(__dirname, '..', 'avatar'), { prefix: '/avatar/' });
	//app.useStaticAssets(join(__dirname, '..', '..', 'avatar'));
	//TODO use nestjs way of setting up the data sourcd
	app.listen(BACKEND_PORT);
	/*
	await data_source.initialize().then(() => {
		app.listen(BACKEND_PORT);
	}).catch((error) => console.error(error));
   */
}
bootstrap();
