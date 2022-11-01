import { NestFactory } from '@nestjs/core';
import { Controller, Get, Module, UseGuards, Res, Req, Injectable, Logger } from '@nestjs/common';
import { AuthGuard, PassportStrategy, PassportModule } from '@nestjs/passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';

@Injectable()
class MyStrategy extends PassportStrategy(OAuth2Strategy, 'oauth2') {
	constructor() {
		super({
		    authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
		    tokenURL: 'https://api.intra.42.fr/oauth/token',
		    clientID: '',
		    clientSecret: '',
		    callbackURL: 'http://0.0.0.0:3000/oauth/hello',
		    passReqToCallback: true,
		    scope: 'public',
		});
	}

	async validate(request: any, accessToken: string, refreshToken: string, profile, done: (err, user) => void) {
		try {
			const user = {accessToken};
			console.log("hello");
			done(null, user);
		} catch (err) {
			console.log("no");
			done(err, false);
		}
	}
}

@Controller('oauth')
class AppController {

  @Get('hello')
  @UseGuards(AuthGuard('oauth2'))
  getMessage(): string {
	  return "Hello There";
  }

  @Get('login')
  @UseGuards(AuthGuard('oauth2'))
  async login() {
	  Logger.log('login');
	  return "Hello World";
  }

  @Get('get_token')
  @UseGuards(AuthGuard('oauth2'))
  async getToken(@Req() req, @Res() res: Response) {

  }
}

@Module({
  imports: [PassportModule.register({defaultStrategy: 'oauth2', session: true})],
  controllers: [AppController],
  providers: [MyStrategy],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
