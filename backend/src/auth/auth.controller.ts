import { Controller, Get, UseGuards, Req, Res, Put } from '@nestjs/common';
import { Request, Response } from 'express';
import { OAuth2Guard } from './oauth.guard';
import { AuthorizationCode } from 'simple-oauth2';

@Controller('oauth')
export class AuthController {

	@Get('login')
	@UseGuards(OAuth2Guard)
	async getHello() {
		return 'well hello there';
	}

	@Get('callback')
	@UseGuards(OAuth2Guard)
	async get_token(@Req() request: Request, @Res() response: Response) {
		return response.redirect('http://localhost:3000');
	}
}
