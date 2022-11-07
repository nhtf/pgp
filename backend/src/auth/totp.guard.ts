import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as TotpStrategy } from 'passport-totp';

@Injectable()
export class TotpGuard extends PassportStrategy(TotpStrategy, 'totp') {
	constructor() {
		super();
	}

	async validatse(user, done) {
		console.log('hi');
		return done(null, 'asdfas4r342rasfe4324e23', 30);
	}
}
