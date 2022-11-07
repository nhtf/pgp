import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { Module } from '@nestjs/common';
import { AuthStrategy } from './auth/oauth.guard';
import { WSConnection } from './wsconnection';
// import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
	imports: [
		PassportModule.register({ defaultStrategy: 'oauth2', session: false }),
		// TypeOrmModule.forRoot({ type: 'postgres', username: 'postgres', password: 'postgres', host: '172.19.0.2' })
	],
	controllers: [AppController],
	providers: [AuthStrategy, WSConnection],
})
export class AppModule { }
