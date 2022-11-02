import { NestFactory } from '@nestjs/core';
import { Controller, Get, Module, UseGuards, Res, Req, Injectable, Logger, Post } from '@nestjs/common';
import { AuthGuard, PassportStrategy, PassportModule } from '@nestjs/passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { Response } from 'express';

@Injectable()
class BearerGuard extends PassportStrategy(BearerStrategy, 'bearer') {
	constructor() {
		super();
	}

	async validate(token, done: (err, user) => void) {
		console.log('bearer');
		done(null, false);
	}
}

@Injectable()
class AuthStrategy extends PassportStrategy(OAuth2Strategy, 'oauth2') {
	constructor() {
		super({
		    authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
		    tokenURL: 'https://api.intra.42.fr/oauth/token',
		    clientID: '',
		    clientSecret: '',
		    callbackURL: 'http://0.0.0.0:3000/oauth/get_token',
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
  @UseGuards(AuthGuard('bearer'))
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
	  try {
		  res.cookie('oAuth2', req.user.accessToken, {sameSite: true});
		  res.redirect('http://localhost:3000/oauth/hello');
		  return res.send();
	  } catch (e) {
		  return res.send(e);
	  }
  }
}

@Module({
  imports: [PassportModule.register({defaultStrategy: 'bearer', session: false})],
  controllers: [AppController],
  providers: [AuthStrategy, BearerGuard],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
