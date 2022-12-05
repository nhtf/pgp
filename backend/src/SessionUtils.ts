import { Injectable } from '@nestjs/common';
import { AuthLevel } from './UserService';
import * as session from 'express-session';

declare module 'express-session' {
	export interface SessionData {
		access_token: string;
		secret: string | undefined;
		user_id: number;
		auth_level: AuthLevel;
		callback_redirect: string | undefined;
	}
}

export type SessionObject = session.Session & Partial<session.SessionData>;

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

	async save_session(session: session.Session): Promise<boolean> {
		const promise = new Promise((resolve: (value: boolean) => void, reject) => {
			session.save((error) => {
				if (error)
					reject(error);
				else
					resolve(true);
			});
		});
		try {
			return await promise;
		} catch (error) {
			console.error('unable to save session: ' + error);
			return false;
		}
	}
}
