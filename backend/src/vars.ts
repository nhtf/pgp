export const PROD: boolean = process.env.NODE_ENV === "production";

export const SSL: boolean = process.env.SSL === "true";

export const FRONTEND_DEV_HOST: string = process.env.FRONTEND_DEV_HOST;
export const BACKEND_DEV_HOST: string = process.env.BACKEND_DEV_HOST;

export const HOST: string = process.env.HOST;
export const DB_PORT: number = Number(process.env.POSTGRES_PORT);
export const DB_USER: string = process.env.POSTGRES_USERNAME;
export const DB_PASS: string = process.env.POSTGRES_PASSWORD;
export const DB_DATABASE: string = process.env.POSTGRES_DB;

export const BACKEND_PORT: number = Number(PROD ? process.env.BACKEND_PROD_PORT : process.env.BACKEND_DEV_PORT);
export const FRONTEND_PORT: number = Number(PROD ? process.env.FRONTEND_PROD_PORT : process.env.FRONTEND_DEV_PORT);

export const SCHEME: string = SSL ? "https" : "http";

export const BACKEND_ADDRESS: string = `${SCHEME}://${process.env.BACKEND_ADDRESS}`
export const FRONTEND_ADDRESS: string = `${SCHEME}://${process.env.FRONTEND_ADDRESS}`

export const SESSION_SECRET: string = process.env.SESSION_SECRET;

export const AVATAR_DIR: string = process.env.AVATAR_DIR;
export const DEFAULT_AVATAR: string = process.env.DEFAULT_AVATAR;

export const PGP_DEBUG: boolean = process.env.PGP_DEBUG === "true";

export const PURGE_INTERVAL: number = Number(process.env.PURGE_INTERVAL);
export const IDLE_TIME: number = Number(process.env.IDLE_TIME);
export const OFFLINE_TIME: number = Number(process.env.OFFLINE_TIME);

export const SESSION_PURGE_TIME: number = Number(process.env.SESSION_PURGE_TIME || 90000);
export const SESSION_IDLE_TIME: number = Number(process.env.SESSION_IDLE_TIME || 1800000);
export const SESSION_ABSOLUTE_TIMEOUT: number = Number(process.env.SESSION_ABSOLUTE_TIMEOUT || 43200000);
export const SESSION_REGENERATE_TIME: number = Number(process.env.SESSION_REGENERATE_TIME || SESSION_IDLE_TIME / 3);

export const CLIENT_ID: string = process.env.CLIENT_ID;
export const CLIENT_SECRET: string = process.env.CLIENT_SECRET;

export const AVATAR_EXT: string = process.env.AVATAR_EXT || ".gif";
export const TENOR_KEY: string = process.env.TENOR_KEY;
export const GIPHY_KEY: string = process.env.GIPHY_KEY;

export const BOUNCER_ADDRESS: string =  `${SCHEME}://${process.env.BOUNCER_LISTEN}`;
export const BOUNCER_KEY: string = process.env.BOUNCER_KEY;
export const BOUNCER_MAX_REDIRECTS: number = Number(process.env.BOUNCER_MAX_REDIRECTS || 5);

export const AUTH_SECRET: string = process.env.AUTH_SECRET;

export const EMBED_MAXLENGTH: number = Number(process.env.EMBED_MAXLENGTH || 10485760);
export const EMBED_ALGORITHM: string = process.env.EMBED_ALGORITHM || "sha256";
export const EMBED_LIMIT: number = Number(process.env.EMBED_LIMIT || 5);

export const FUZZY_THRESHOLD: number = Number(process.env.FUZZY_THRESHOLD) ?? 0.1;
export const RAMBLER_SECRET: string = process.env.RAMBLER_SECRET;
