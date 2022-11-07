import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';

@Injectable()
export class AuthStrategy extends PassportStrategy(OAuth2Strategy, 'oauth2') {
	constructor() {
		super({
			authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
			tokenURL: 'https://api.intra.42.fr/oauth/token',
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: 'http://localhost:3000/oauth/get_token',
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
