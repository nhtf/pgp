import { Controller, Get, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('oauth')
export class AppController {
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
			res.cookie('oauth2', req.user.accessToken, { sameSite: 'none' });
			res.redirect('http://0.0.0.0:8080');
			return res.send();
		} catch (e) {
			return res.send(e);
		}
	}
}
