import { Injectable, Inject } from "@nestjs/common";
import { Repository, DeepPartial } from "typeorm";
import { GameRoom } from "src/entities/GameRoom";
import { Gamemode } from "src/enums";
import { GameState } from "src/entities/GameState";
import { Team } from "src/entities/Team";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { GenericRoomService, CreateRoomOptions } from "src/services/new.room.service";
import type { User } from "src/entities/User";
import type { Player } from "src/entities/Player";

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
			@Inject("GAMESTATE_REPO")
			private readonly state_repo: Repository<GameState>,
			@Inject("PLAYER_REPO")
			private readonly player_repo: Repository<Player>,
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

		async get_history(user: User): Promise<GameState[]> {
			return await this.state_repo
			.createQueryBuilder("state")
			.where((qb) => {
				const subQuery = qb
					.subQuery()
					.select("1")
					.from(GameState, "tstate")
					.leftJoin("tstate.teams", "teams")
					.leftJoin("teams.players", "players")
					.leftJoin("players.user", "user")
					.where("user.id = :id")
					.andWhere("tstate.id = state.id")
					.getQuery();
				return `EXISTS ${subQuery}`;
			})
			.setParameter("id", user.id)
			.leftJoinAndSelect("state.teams", "teams")
			.leftJoinAndSelect("teams.players", "players")
			.leftJoinAndSelect("players.user", "user")
			.getMany();
		}

		async get_players(room: GameRoom, user: User): Promise<Player | null> {
			//return this.player_repo.findOneBy({ { user: { id: user.id } }, team: { state: { room: { id: room.id } } } });
			return this.player_repo.findOneBy({
				user: {
					id: user.id,
				},
				team: {
					state: {
						room: {
							id: room.id,
						},
					},
				},
			});
		}

		async remove_players(...players: Player[]) {
			return this.player_repo.remove(players);
		}

		async save_states(...states: DeepPartial<GameState>[]): Promise<GameState[]> {
			return this.state_repo.save(states);
		}

		async get_state(room: GameRoom): Promise<GameState> {
			return this.state_repo.findOne({
			where: {
				room: {
					id: room.id
				}
			},
			relations: {
				teams: {
					players: {
						user: true
					}
				}
			}
		});

		}
}
