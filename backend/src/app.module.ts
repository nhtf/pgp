import { AppController } from './app.controller';
import { Module } from '@nestjs/common';
import { WSConnection } from './wsconnection';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth/auth.controller';
import { TotpController } from './auth/totp.controller';

@Module({
	imports: [
		/*TypeOrmModule.forRoot({ type: 'postgres', username: 'postgres', password: 'postgres', host: '172.19.0.2' }),*/
	],
	controllers: [AppController, AuthController, TotpController],
	providers: [WSConnection],
})
export class AppModule { }
