import { Injectable } from "@nestjs/common";
import { AuthLevel } from "src/enums/AuthLevel";
import * as session from "express-session";
import { db_pool } from "src/app.module";
import { HOST, DB_PORT, DB_USER, DB_PASS, SESSION_SECRET } from 'src/vars';

export const session_store = new (require("connect-pg-simple")(session))({
	pool: db_pool
});

export const session_middleware = session({
	store: session_store,
	secret: SESSION_SECRET,
	resave: true,
	saveUninitialized: false,
	cookie: {
		maxAge: 72000000, //TODO set the right maxAge
		sameSite: 'strict',
		secure: false, //TODO set to true
	},
});

declare module 'express-session' {
	export interface SessionData {
		access_token: string;
		secret: string | undefined;
		user_id: number;
		auth_level: AuthLevel;
		callback_redirect: string | undefined;
		last_activity: Date;
	}
}

export type SessionObject = session.Session & Partial<session.SessionData>;

@Injectable()
export class SessionService {

	constructor() {
		setInterval(async () => {
			await this.purge();
		}, 15000); //TODO make PURGE_INTEVAL an env variable
	}

	async purge() {
		const now = Date.now();
		for (const session of session_store.all()) {
			if (now - session.last_activity.getTime() >= 10000) {
				try {
					this.destroy_session(session);
				} catch (error) {
					console.error(error);
				}
			}
		}
	}

	async regenerate_session(session: session.Session): Promise<boolean> {
		const promise = new Promise(
			(resolve: (value: boolean) => void, reject: (value: boolean) => void) => {
				session.regenerate((error) => {
					if (error) {
						console.error('could not regenerate session: ' + error);
						reject(false);
					} else {
						resolve(true);
					}
				});
			},
		);
		return await promise;
	}

	async save_session(session: session.Session): Promise<boolean> {
		const promise = new Promise((resolve: (value: boolean) => void, reject) => {
			session.save((error) => {
				if (error) reject(error);
				else resolve(true);
			});
		});
		try {
			return await promise;
		} catch (error) {
			console.error('unable to save session: ' + error);
			return false;
		}
	}

	async destroy_session(session: session.Session): Promise<boolean> {
		const promise = new Promise(
			(resolve: (value: boolean) => void, reject: (value: boolean) => void) => {
				session.destroy((error) => {
					if (error) {
						console.error('could not destroy session');
						reject(false);
					} else {
						resolve(true);
					}
				});
			},
		);
		return await promise;
	}

	async heartbeat(session: SessionObject) {
		session.last_activity = new Date();
	}
}
