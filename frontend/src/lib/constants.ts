const env = import.meta.env;

console.log(env);

const FRONTEND_DEV_ADDRESS = "localhost:5173";
const BACKEND_DEV_ADDRESS = "localhost:3000";
const BOUNCER_DEV_ADDRESS = "localhost:8080";

const FRONTEND_PROD_ADDRESS = "pgp.hyxo.nl";
const BACKEND_PROD_ADDRESS = "api.pgp.hyxo.nl";
const BOUNCER_PROD_ADDRESS = "bouncer.pgp.hyxo.nl";

const prod = env["MODE"] === "production";

const PROTOCOL = prod ? "https" : "http";
const WS = prod ? "wss" : "ws";

export const FRONTEND_ADDRESS = "localhost:5173";
export const BACKEND_ADDRESS = "localhost:3000";
export const BOUNCER_ADDRESS = "localhost:8080";
export const FRONTEND = `${PROTOCOL}://${FRONTEND_ADDRESS}`;
export const BACKEND = `${PROTOCOL}://${BACKEND_ADDRESS}`;
export const BOUNCER = `${PROTOCOL}://${BOUNCER_ADDRESS}`;
export const BACKEND_WS = `${WS}://${BACKEND_ADDRESS}`;

export const asset_path = "/Assets";
export const icon_path = `${asset_path}/icons`;

export const status_colors = ["gray", "yellow", "green", "blue"];

export const gamemode_icons: Map<number, string>[] = [
	new Map([ [ 2, "pong-classic.svg" ] ]),
	new Map([ [ 2, "vr.svg" ] ]),
	new Map([ [ 2, "hexagon.svg" ], [ 4, "hexagon4p.svg" ] ]),
];
