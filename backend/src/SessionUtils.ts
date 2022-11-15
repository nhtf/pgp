import { Injectable } from '@nestjs/common';
import { AuthLevel } from './User';
import * as session from 'express-session';

declare module 'express-session' {
	export interface SessionData {
		access_token: object;
		secret: string | undefined;
		user_id: number;
		auth_level: AuthLevel;
	}
}

@Injectable()
export class SessionUtils {

	async regenerate_session(session: session.Session): Promise<boolean> {
		const promise = new Promise((resolve: (value: boolean) => void, reject: (value: boolean) => void) => {
			session.regenerate((error) => {
				if (error) {
					console.error('could not regenerate session: '+ error);
					reject(false);
				} else {
					resolve(true);
				}
			});
		});
		return await promise;
	}
}
