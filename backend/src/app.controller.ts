import { Controller, Get, Req, Res, UseGuards, Logger, Post, HttpCode, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { authenticator, totp } from 'otplib';
import * as notp from 'notp';
import * as qrcode from 'qrcode';
import * as base32 from 'thirty-two';

class TotpDto {
	code: string;
}

@Controller('oauth')
export class AppController {
	@Get('login')
	@UseGuards(AuthGuard('oauth2'))
	async login() {
		Logger.log('login');
		return "Hello World";
	}

	@Post('totp')
	async verify(@Body() totpDto: TotpDto) {
		try {
			const code = authenticator.generate('DUGEURQ6NZLB4DC4');

			const secret = authenticator.generateSecret();
			/*
			console.log(typeof secret);
			const otpauth = authenticator.keyuri('hi', 'pgp', secret);
			qrcode.toDataURL(otpauth, (err, imageUrl) => {
				if (err) {
					console.log('err');
					return;
				}
				console.log(imageUrl);
			});

			console.log('thing: ' + otpauth);
			console.log('secret: ' + secret);
			*/

			console.log(code);
			console.log(Date.now());
			//console.log('notp: ' + notp.totp.gen(base32.encode('MQZCEHD3GFYEA3IC')));
			const valid = authenticator.check(code, 'DUGEURQ6NZLB4DC4');
			console.log('valid?: ' + valid);
		} catch (err) {
			console.log(err);
		}
	}

	@Get('get_token')
	@UseGuards(AuthGuard('oauth2'))
	async getToken(@Req() req, @Res() res: Response) {
		try {
			res.cookie('oauth2', req.user.accessToken, { sameSite: 'none' });
			res.redirect('http://0.0.0.0:8080');
			return res.send();
		} catch (e) {
			return res.send(e);
		}
	}
}
