import { AppController } from './app.controller';
import { Module } from '@nestjs/common';
import { OAuth2Guard } from './auth/oauth.guard';
import { WSConnection } from './wsconnection';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth/auth.controller';


@Module({
	imports: [
		/*TypeOrmModule.forRoot({ type: 'postgres', username: 'postgres', password: 'postgres', host: '172.19.0.2' }),*/
	],
	controllers: [AppController, AuthController],
	providers: [OAuth2Guard, WSConnection],
})
export class AppModule { }
