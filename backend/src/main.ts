import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session'

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(
		session({
			secret: 'changethis',
			resave: true,
			saveUninitialized: false,
			cookie: {
				maxAge: 720000, //TODO set the right maxAge
				sameSite: 'strict'
			}
		}),
	);
	app.enableCors();
	await app.listen(3000);
}
bootstrap();
