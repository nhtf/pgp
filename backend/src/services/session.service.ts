import { Injectable } from "@nestjs/common";
import { AuthLevel } from "src/enums/AuthLevel";
import * as session from "express-session";
import { Request } from "express";
import { session_store } from "src/app.module";
import { HOST, DB_PORT, DB_USER, DB_PASS, SESSION_SECRET, SESSION_IDLE_TIME, SESSION_REGENERATE_TIME, SESSION_PURGE_TIME } from 'src/vars';

declare module 'express-session' {
	export interface SessionData {
		access_token: string;
		secret: string | undefined;
		user_id: number;
		auth_level: AuthLevel;
		last_activity: number;
	}
}

export type SessionObject = session.Session & Partial<session.SessionData>;

@Injectable()
export class SessionService {

	constructor() {
		setInterval(async () => {
			await this.purge();
		}, SESSION_PURGE_TIME);
	}

	async purge() {
		const now = Date.now();
		const sessions = await this.all();
		for (const session of sessions) {
			if (!session.sess?.last_activity) {
				console.log("destroying old session");
				await this.destroy_session(session.sid);
				continue;
			}
			if (now - session.sess.last_activity >= SESSION_IDLE_TIME) {
				console.log("purging session " + session.sid);
				//TODO send message to client to redirect
				try {
					await this.destroy_session(session.sid);
				} catch (error) {
					console.error(error);
				}
			}
		}
	}

	//TODO make types for type safety
	async all() {
		const promise = new Promise(
			(resolve: (data) => void, reject: (err) => void) => {
				session_store.all((error, data) => {
					if (error) {
						reject(error);
					} else {
						resolve(data);
					}
				});
			}
		);
		return promise;
	}

	async regenerate_session_req(req: Request) {
		const access_token = req.session.access_token;
		const secret = req.session.secret;
		const user_id = req.session.user_id;
		const auth_level = req.session.auth_level;
		const last_activity = req.session.last_activity;

		await this.regenerate_session(req.session);

		req.session.access_token = access_token;
		req.session.secret = secret;
		req.session.user_id = user_id;
		req.session.auth_level = auth_level;
		req.session.last_activity = last_activity;
	}

	async regenerate_session(session: SessionObject): Promise<boolean> {
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

	async destroy_session(session: session.Session | string): Promise<boolean> {
		const promise = new Promise(
			(resolve: (value: boolean) => void, reject: (value: boolean) => void) => {
				if (typeof session === "string") {
					session_store.destroy(session, (error) => {
						if (error) {
							console.error("could not destroy session");
							reject(false);
						} else {
							resolve(true);
						}
					});
				} else {
					session.destroy((error) => {
						if (error) {
							console.error('could not destroy session');
							reject(false);
						} else {
							resolve(true);
						}
					});
				}
			},
		);
		return await promise;
	}


	async heartbeat(req: Request) {
		const last_activity = req.session.last_activity;
		if (last_activity) {
			if (Date.now() - last_activity >= SESSION_REGENERATE_TIME) {
				console.log("regenerating session of user_id " + req.session.user_id);
				await this.regenerate_session_req(req);
			}
		}
		req.session.last_activity = Date.now();
	}
}
