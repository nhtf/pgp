const env = import.meta.env;

const ssl = env["VITE_SSL"] === "true";

const PROTOCOL = ssl ? "https" : "http";
const WS = ssl ? "wss" : "ws";

export const FRONTEND_ADDRESS = env["VITE_FRONTEND_ADDRESS"];
export const BACKEND_ADDRESS = env["VITE_BACKEND_ADDRESS"];
export const BOUNCER_ADDRESS = env["VITE_BOUNCER_ADDRESS"];
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
