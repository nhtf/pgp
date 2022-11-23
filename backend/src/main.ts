import * as dotenv from 'dotenv';
dotenv.config();
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './User';
import * as session from 'express-session';
import { HOST, FRONTEND_ADDRESS, BACKEND_PORT, DB_PORT, DB_USER, DB_PASS } from './vars';

export const data_source = new DataSource({
	type: 'postgres',
	host: HOST,
	port: DB_PORT,
	//TODO use env variables here
	username: 'postgres',
	password: 'postgres',
	database: 'dev',
	entities: [User],
	synchronize: true,
	logging: true,
});

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
		app.use(
			session({
				store: new (require('connect-pg-simple')(session))({
					//TODO this is probably not the right way to connect to the database for sessions
					conString: 'postgres://postgres:postgres@localhost:5432/dev',
					createTableIfMissing: true
				}),
				secret: 'changethis', //TODO change this to an actual secret
				resave: true,
				saveUninitialized: false,
				cookie: {
					maxAge: 720000, //TODO set the right maxAge
					sameSite: 'strict'
				}
			}),
		);
	app.enableCors({
		      'origin': FRONTEND_ADDRESS,
		      'credentials': true
	});
	app.useGlobalPipes(new ValidationPipe());
	//TODO use nestjs way of setting up the data sourcd
	await data_source.initialize().then(() => {
		app.listen(BACKEND_PORT);
	}).catch((error) => console.error(error));
}
bootstrap();
