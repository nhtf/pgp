import type { User } from "src/entities/User";
import { Player } from "src/entities/Player";
import { Injectable, Inject } from "@nestjs/common";
import { Repository, DeepPartial } from "typeorm";
import { GameRoom } from "src/entities/GameRoom";
import { Gamemode } from "src/enums";
import { GameState } from "src/entities/GameState";
import { Team } from "src/entities/Team";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { GenericRoomService, CreateRoomOptions } from "src/services/room.service";
import { genTeamName } from "src/namegen"
import { AchievementService } from  "src/services/achievement.service";
import { VRPONG_ACHIEVEMENT, CLASSIC_LOSES_ACHIEVEMENT } from "src/achievements";

interface CreateGameRoomOptions extends CreateRoomOptions {
	gamemode: Gamemode;
	players: number;
	ranked?: boolean;
	teams_locked?: boolean;
}

export const PLAYER_NUMBERS = new Map([
	[Gamemode.CLASSIC, [2]],
	[Gamemode.VR, [2]],
	[Gamemode.MODERN, [2, 4]],
]);

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
			private readonly ach_service: AchievementService,
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
			state.team_count = options.players;
			state.ranked = options.ranked ?? false;
			state.teamsLocked = options.teams_locked ?? false;
			state.teams = [];

			for (let idx = 0; idx < options.players; ++idx) {
				const team = new Team();

				while (true) {
					team.name = genTeamName(20);
					if (state.teams.findIndex((other) => other.name == team.name) < 0)
						break;
				}
				team.players = [];
			
				state.teams.push(team);
			}

			room.state = state;

			state.room = { id: room.id } as GameRoom;
		
			return this.room_repo.save(room);
		}

		async gameFinished(state: GameState) {
			await this.lock_teams_state(state.id);
		
			if (state.finished) {
				const users = state.teams.flatMap(({ players }) => players.map(({ user }) => user));
				const scores = state.teams.map(team => team.score);
				const maxScore = Math.max(...scores);
				
				switch (state.gamemode) {
					case Gamemode.VR:
						await this.ach_service.inc_progresses(VRPONG_ACHIEVEMENT, 1, users);
						break;
					case Gamemode.CLASSIC:
						const losers = state.teams
							.filter(({ score }) => score < maxScore)
							.flatMap(({ players }) => players.map(({ user }) => user));
						await this.ach_service.inc_progresses(CLASSIC_LOSES_ACHIEVEMENT, 1, losers);
						break;
				}
			}

			await this.remove({ id: state.roomId } as GameRoom);
			await this.state_repo.save({
				id: state.id,
				finished: true,
				terminated: true,
			});
		}

		async remove_members(room: GameRoom, ...members: { member: GameRoomMember, ban?: boolean }[]) {
			room = await this.find(room, { banned_users: true });

			const removing = members.map(({ member }) => member);
			const banning = members.filter(({ ban }) => ban).map(({ member }) => member.user);
		
			await this.member_repo.remove(removing);
			await this.ban(room, ...banning);

			room = await this.find(room);

			if (!room.members.length || (room.state.ranked && members.some(({ member }) => member.player != undefined))) {
				await this.gameFinished(room.state);
			}
		}

		async set_team(member: GameRoomMember, team: Team) {
			if (!member.player && team) {
				member.player = new Player();
				member.player.user = member.user;
			} else if (member.player && !team) {
				await this.remove_players(member.player);
				member.player = null;
			}
			
			if (team) {
				member.player.team = team;
			}
		
			await this.save_members(member);
		}

		async get_teams(room: GameRoom): Promise<Team[]> {
			if (room?.state?.teams == undefined)
				room.state = await this.get_state(room);
			return room.state.teams;
		}

		async lock_teams_state(id: number) {
			await this.save_states({ id: id, teamsLocked: true });
		}

		async lock_teams(room: GameRoom) {
			await this.lock_teams_state(room.state.id);
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
			return this.state_repo.findOneBy({ room: { id: room.id } });
		}

		async is_in_ranked(user: Pick<User, "id">): Promise<boolean> {
			const room = await this.state_repo.findOneBy({
				ranked: true,
				finished: false,
				terminated: false,
				teams: {
					players: {
						user: {
							id: user.id,
						}
					}
				}
			});
			/*(
					members: {
						user: {
							id: user.id,
						},
					},
				},
			});*/
			return room != undefined;
		}

		async get_states(user: Pick<User, "id">): Promise<GameState[]> {
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
}
