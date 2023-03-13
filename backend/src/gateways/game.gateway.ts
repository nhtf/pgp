import { Inject } from "@nestjs/common";
import { User } from "src/entities/User";
import { Team } from "src/entities/Team";
import { GameState} from "src/entities/GameState"
import { MessageBody, SubscribeMessage, ConnectedSocket } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { Repository, In } from "typeorm"
import { GameRoom } from "src/entities/GameRoom";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { ProtectedGateway } from "src/gateways/protected.gateway";
import { UpdateGateway } from "src/gateways/update.gateway"
import { Action, Status, Subject } from "src/enums"

type BroadcastData = {
	name: "update" | "synchronize" | "desync-check",
	snapshot: {
		state: {
			teams: Team[],
		},
	},
}

export class GameGateway extends ProtectedGateway("game") {
	constructor(
		@Inject("USER_REPO")
		private readonly userRepo: Repository<User>,
		@Inject("GAMEROOM_REPO")
		private readonly roomRepo: Repository<GameRoom>,
		@Inject("GAMEROOMMEMBER_REPO")
		private readonly memberRepo: Repository<GameRoomMember>,
		@Inject("GAMESTATE_REPO")
		private readonly gameStateRepo: Repository<GameState>,
		@Inject("TEAM_REPO")
		private readonly teamRepo: Repository<Team>,
	) {
		super(userRepo);
	}

	async onDisconnect(client: Socket, user: User) {
		await this.users.save({ id: user.id, activeRoom: null });

		UpdateGateway.instance.send_update({
			subject: Subject.USER,
			action: Action.SET,
			id: user.id,
			value: { status: user.status, activeRoomId: null }
		});
	}

	async onJoin(@ConnectedSocket() client: Socket, user: User) {
		await this.users.save({ id: user.id, activeRoom: { id: client.room }});
	
		client.join(String(client.room));
	
		UpdateGateway.instance.send_update({
			subject: Subject.USER,
			action: Action.SET,
			id: user.id,
			value: { status: Status.INGAME, activeRoomId: client.room }
		});
	}

	@SubscribeMessage("broadcast")
	async broadcast(@ConnectedSocket() client: Socket, @MessageBody() data: BroadcastData) {
		client.to(String(client.room)).emit("broadcast", data);


		if (data.name === "synchronize") {
			let scoreUpdate = false;
		
			const state = data.snapshot.state;
		
			// console.log(state.teams.map((team) => team.score));
		
			// state.teams.forEach(async (team) => {
			// 	const old = await this.teamRepo.findOne({
			// 		where: { id: team.id },
			// 		relations: {
			// 			players: true,
			// 		}
			// 	});

			// 	console.log(old, team);

			// 	if (old.score !== team.score) {
			// 		await this.teamRepo.save(team);
			// 		team.players = old.players;
			// 		scoreUpdate = true;
			// 	}
			// });
		
			for (let teamState of state?.teams || []) {
				const team = await this.teamRepo.findOne({
					where: { id: teamState.id },
					relations: {
						players: true,
					}
				});

				if (team?.score !== teamState.score) {
					teamState = await this.teamRepo.save({ id: team.id, score: teamState.score });
					scoreUpdate = true;
				}
			}

			if (scoreUpdate) {
				const teamIds = state.teams.map((team) => team.id);
				const { id } = await this.gameStateRepo.findOneBy({ teams: { id: In(teamIds) } });
			
				console.log(id);
				UpdateGateway.instance.send_update({
					subject: Subject.GAMESTATE,
					action: Action.SET,
					id,
					value: { teams: state.teams }
				})
			}
		}
	}

	@SubscribeMessage("ping")
	ping(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		client.emit("pong", data);
	}
}
