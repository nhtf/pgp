import { Injectable, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { GameRoom } from "src/entities/GameRoom";
import { Gamemode } from "src/enums";
import { GameState } from "src/entities/GameState";
import { Team } from "src/entities/Team";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { GenericRoomService, CreateRoomOptions } from "src/services/new.room.service";

interface CreateGameRoomOptions extends CreateRoomOptions {
	gamemode: Gamemode;
	players: number;
}

export const PLAYER_NUMBERS = new Map([
	[Gamemode.CLASSIC, [2]],
	[Gamemode.VR, [2]],
	[Gamemode.MODERN, [2, 4]],
]);

//TODO better names
const TEAM_NAMES = ["one", "two", "three", "four"];

@Injectable()
export class GameRoomService extends GenericRoomService<GameRoom, GameRoomMember, CreateRoomOptions>(GameRoom, GameRoomMember) {

		constructor(
			@Inject("GAMEROOM_REPO")
			room_repo: Repository<GameRoom>,
			@Inject("GAMEROOMMEMBER_REPO")
			member_repo: Repository<GameRoomMember>,
		) {
			super(room_repo, member_repo);
		}

		async create(options: CreateGameRoomOptions) {
			const player_count = PLAYER_NUMBERS.get(options.gamemode);
			if (!player_count.includes(options.players))
				throw new Error(`Invalid amount of players ${options.players} for gamemode ${options.gamemode.toString()}. Possible values: ${player_count}`);

			const room = await super.create(options);
			const state = new GameState();

			state.gamemode = options.gamemode;
			state.teams = [];

			for (let idx = 0; idx < options.players; ++idx) {
				const team = new Team();

				team.name = `team ${TEAM_NAMES[idx]}`;
				team.players = [];
				state.teams.push(team);
			}

			room.state = state;
		
			return room;
		}
}
