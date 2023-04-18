export enum Subject {
	USER,
	INVITE,
	ROOM,
	MEMBER,
	FRIEND,
	MESSAGE,
	GAMESTATE,
	TEAM,
	BLOCK,
	PLAYER,
	ACHIEVEMENT,
	SCORE,
	REDIRECT,
}

export enum Action {
	INSERT,
	UPDATE,
	REMOVE,
}

export enum Role {
	MEMBER,
	ADMIN,
	OWNER,
};

export enum Access {
	PUBLIC,
	PROTECTED,
	PRIVATE,
};

export enum Gamemode {
	CLASSIC,
	VR,
	MODERN,
};

export enum Status {
	OFFLINE,
	IDLE,
	ACTIVE,
	INGAME,
}

export enum CoalitionColors {
	CETUS = "3AA2DB",
	PYXIS = "B73188",
	VELA = "E52A2D",
}

export function enumKeys(e: any) {
	return [...Array(Object.keys(e).length / 2).keys()]
}

const PLAYER_NUMBERS: [Gamemode, number[], string][] = [
	[Gamemode.CLASSIC, [2], "Classic"],
	[Gamemode.VR, [2], "VR"],
	[Gamemode.MODERN, [2, 4], "Modern"],
];

export const gamemodes = PLAYER_NUMBERS.map(([gamemode, teams, name]) => {
	return teams.map((team) => {
		return {
			title: `${name}${teams.length > 1 ? ` ${team}P` : ""}`,
			gamemode,
			team,
		}
	});
}).flat();
