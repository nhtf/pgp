import { Controller, Get, Injectable, Logger, Module, Req, Res, UseGuards } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AuthGuard, PassportModule, PassportStrategy } from '@nestjs/passport';
import { MessageBody, SubscribeMessage, WebSocketGateway, WsResponse, WebSocketServer, GatewayMetadata, ConnectedSocket } from '@nestjs/websockets';
import { Response } from 'express';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import { HttpService } from '@nestjs/axios';
import * as session from 'express-session';

@WebSocketGateway({ cors: true })
class EventHandler {
	@WebSocketServer()
	server: Server;

	async handleConnection(client: Socket, ...args: any[]) {
		console.log(client.request.headers);
		setInterval(() => client.emit('kaas', 'jouw kaas'), 1000);
	}

	@SubscribeMessage('kaas')
	async getKaas(@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<any> {
		console.log(data);
		return 'mijn kaas';
	}

	/*
	@SubscribeMessage('kaas')
	getHello(@MessageBody() data: any): Observable<WsResponse<string>> {
		return from('Hello World!').pipe(map(thing => ({ event: 'events', data: thing })));
	}
   */
}

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
			clientID: 'u-s4t2ud-444c4de01d42cdf77c0c6706d17847aabfe9315c224892c2493ac668b0abfa34',
			clientSecret: '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',
			callbackURL: 'http://0.0.0.0:3000/oauth/get_token',
			passReqToCallback: true,
			scope: 'public',
		});
	}

	async validate(request: any, accessToken: string, refreshToken: string, profile, done: (err, user) => void) {
		try {
			const user = { accessToken };
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
	//@UseGuards(AuthGuard('bearer'))
	getMessage(@Req() req): string {
		console.log(req.session);
		req.session.logged_in = true;
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
		console.log(req.session);
		req.session.logged_in = true;
		try {
			res.cookie('oauth2', req.user.accessToken, { sameSite: 'none', domain: 'localhost:8080' });
			res.redirect('http://localhost:8080');
			return res.send();
		} catch (e) {
			return res.send(e);
		}
	}
}

@Module({
	imports: [PassportModule.register({ defaultStrategy: 'bearer', session: false })],
	controllers: [AppController],
	providers: [AuthStrategy, BearerGuard, EventHandler],
})
class AppModule { }

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(
		session({
			cookie: {
				maxAge: 3600 * 24 * 1000,
			},
			secret: 'kaas',
			resave: false,
			saveUninitialized: false,
		}),
	);
	app.enableCors();
	await app.listen(3000);
}
bootstrap();
