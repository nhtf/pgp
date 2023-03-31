export const FRONTEND_ADDRESS = "localhost:5173";
export const BACKEND_ADDRESS = "localhost:3000";
export const BOUNCER_ADDRESS = "localhost:8080";
export const FRONTEND = `http://${FRONTEND_ADDRESS}`;
export const BACKEND = `http://${BACKEND_ADDRESS}`;
export const BOUNCER = `http://${BOUNCER_ADDRESS}`;

export const asset_path = "/Assets";
export const icon_path = `${asset_path}/icons`;

export const status_colors = ["gray", "yellow", "green", "blue"];

export const gamemode_icons: Map<number, string>[] = [
	new Map([ [ 2, "pong-classic.svg" ] ]),
	new Map([ [ 2, "vr.svg" ] ]),
	new Map([ [ 2, "hexagon.svg" ], [ 4, "hexagon4p.svg" ] ]),
];
