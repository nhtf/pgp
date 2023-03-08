import { Get, Patch, Param, Body, BadRequestException, ForbiddenException, Inject, ParseIntPipe } from "@nestjs/common";
import { GenericRoomController, CreateRoomDTO } from "src/services/room.service";
import { GameRoom } from "src/entities/GameRoom";
import { IsEnum, IsNumber } from "class-validator";
import { Gamemode, Role } from "src/enums";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { GameState } from "src/entities/GameState";
import { Team } from "src/entities/Team";
import { Player } from "src/entities/Player";
import { User } from "src/entities/User";
import { RoomInvite } from "src/entities/RoomInvite";
import { RequiredRole, GetMember, GetRoom, IRoomService } from "src/services/room.service";
import { Repository, In } from "typeorm";
import { ParseIDPipe, ParseOptionalIDPipe } from "src/util";
import { ERR_NOT_MEMBER, ERR_PERM } from "src/errors";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Me } from "src/util"

class CreateGameRoomDTO extends CreateRoomDTO {
	@IsEnum(Gamemode)
	gamemode: Gamemode;

	@IsNumber()
	players: number;
}

const playerNumbers = new Map([
	[Gamemode.CLASSIC, [2]],
	[Gamemode.VR, [2]],
	[Gamemode.MODERN, [2, 4]],
	[Gamemode.MODERN4P, [4]],
])

// TODO...
const numbers = ["one", "two", "three", "four"];

export class GameController extends GenericRoomController<GameRoom, GameRoomMember>(GameRoom, GameRoomMember, "game", CreateGameRoomDTO) {
	// ODOT: copied from room.service.ts (what is even the point)
	constructor(
		@Inject("GAMEROOM_REPO")
		room_repo: Repository<GameRoom>,
		@Inject("GAMEROOMMEMBER_REPO")
		member_repo: Repository<GameRoomMember>,
		@Inject("ROOMINVITE_REPO")
		invite_repo: Repository<RoomInvite>,
		@Inject("PLAYER_REPO")
		readonly player_repo: Repository<Player>,
		@Inject("GAMESTATE_REPO")
		readonly gamestate_repo: Repository<GameState>,
		@Inject("GAMEROOM_PGPSERVICE")
		service: IRoomService<GameRoom, GameRoomMember>,
		update_service: UpdateGateway,
	) {
		super(room_repo, member_repo, invite_repo, service, update_service);
	}

	async setup_room(room: GameRoom, dto: CreateGameRoomDTO) {
		const playerOptions = playerNumbers.get(dto.gamemode);
		const state = new GameState;

		state.gamemode = dto.gamemode;
		state.teams = [];

		if (!playerOptions || !playerOptions.includes(dto.players)) {
			throw new BadRequestException("Invalid amount of players");
		}

		for (let i = 0; i < dto.players; i++) {
			state.teams.push(new Team(`team ${numbers[i]}`));
		}

		room.state = state;

		await this.room_repo.save(room);
	}

	async get_joined_info(room: GameRoom): Promise<GameRoom> {
		return await this.room_repo.findOne({
			where: {
				id: room.id,
			},
			relations: {
				members: {
					user: true,
				},
				state: {
					teams: true,
				},
			},
		});
	}

	@Get("id/:id")
	// TODO
	// @RequiredRole(Role.MEMBER)
	async get_room(@GetRoom() room: GameRoom) {
		return await this.get_joined_info(room);
	}

	@Get("joined/id/:id")
	async joined_id(@Me() me: User, @Param("id", ParseIntPipe) id: number) {
		const member = await this.member_repo.findOne({
			where: {
				room: {
					id,
				},
				user: {
					id: me.id,
				},
			},
			relations: {
				room: {
					members: {
						user: true,
					},
					state: {
						teams: true,
					},
				},
			},
			// M: frontend sorts by id, backend doesn't need to
			// order: {
			// 	room: {
			// 		state: {
			// 			teams: {
			// 				// TODO: ordering the teams by id to make them always appear on the same side is a very fragile solution
			// 				id: "DSC",
			// 			},
			// 		},
			// 	},
			// },
		});

		return member;
	}

	@Get("history")
	async history(@Me() me: User) {
		return await this.player_repo.find({
			where: {
				user: {
					id: me.id,
				},
			},
			relations: {
				team: {
					state: {
						teams: {
							players: {
								user: true,
							},
						},
					},
				},
			},
		});
	}

	@Patch("id/:id/team/:target")
	@RequiredRole(Role.MEMBER)
	async change_team(
		@GetMember() member: GameRoomMember,
		@GetRoom() room: GameRoom,
		@Param("target", ParseIDPipe(GameRoomMember, { user: true })) target: GameRoomMember,
		@Body("team", ParseOptionalIDPipe(Team)) team?: Team,
	) {
		if (member.room.id !== room.id) {
			throw new BadRequestException(ERR_NOT_MEMBER);
		}

		if ((target.role >= member.role && target.user.id != member.user.id) || (member.role < Role.ADMIN && room.state.teamsLocked)) {
			throw new ForbiddenException(ERR_PERM);
		}

		if (team) {
			if (!member.player) {
				let player = await this.player_repo.findOneBy({
					user: {
						id: member.user.id
					},
					team: {
						state: {
							id: room.state.id
						}
					}
				});

				if (player) {
					member.player = player;
				} else {
					member.player = new Player();
					member.player.user = member.user;
				}
			}

			member.player.team = team;
		} else {
			member.player = null;
		}

		return await this.member_repo.save(member);
	}
}
