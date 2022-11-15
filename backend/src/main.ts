import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './User';
import * as session from 'express-session'

export const data_source = new DataSource({
	type: 'postgres',
	host: 'localhost',
	port: 5432,
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
			secret: 'changethis', //TODO change this to an actual secret
			resave: true,
			saveUninitialized: false,
			cookie: {
				maxAge: 720000, //TODO set the right maxAge
				sameSite: 'strict'
			}
		}),
	);
	app.enableCors();
	await data_source.initialize().then(() => {
		app.listen(3000);
	}).catch((error) => console.error(error));
}
bootstrap();
