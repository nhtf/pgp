export const PROD: boolean = process.env.NODE_ENV === "production";
export const HOST: string = process.env.HOST;
export const DB_PORT: number = Number(process.env.DB_PORT);
export const DB_USER: string = process.env.DB_USER;
export const DB_PASS: string = process.env.DB_PASS;
export const BACKEND_PORT: number = Number(PROD ? process.env.BACKEND_PROD_PORT : process.env.BACKEND_DEV_PORT);
export const FRONTEND_PORT: number = Number(PROD ? process.env.FRONTEND_PROD_PORT : process.env.FRONTEND_DEV_PORT);
export const BACKEND_ADDRESS: string =
	"http://" + process.env.HOST + ":" + BACKEND_PORT;
export const FRONTEND_ADDRESS: string =
	"http://" + process.env.HOST + ":" + FRONTEND_PORT;
export const SESSION_SECRET: string = process.env.SESSION_SECRET;
export const AVATAR_DIR: string = process.env.AVATAR_DIR;
export const DEFAULT_AVATAR: string = process.env.DEFAULT_AVATAR;
export const PGP_DEBUG: boolean = process.env.PGP_DEBUG === "true";
export const PURGE_INTERVAL: number = Number(process.env.PURGE_INTERVAL);
export const IDLE_TIME: number = Number(process.env.IDLE_TIME);
export const OFFLINE_TIME: number = Number(process.env.OFFLINE_TIME);
