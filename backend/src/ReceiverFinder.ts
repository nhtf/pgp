import type { Room } from "src/entities/Room"
import type { Invite } from "src/entities/Invite"
import type { Member } from "src/entities/Member"
import type { Message } from "src/entities/Message"
import type { GameState } from "src/entities/GameState"
import type { Team } from "src/entities/Team"
import { Repository, FindOptionsRelations } from "typeorm"
import { Inject } from "@nestjs/common";
import { Subject } from "src/enums"

export class ReceiverFinder {
	static instance: ReceiverFinder;

	constructor(
		@Inject("ROOM_REPO") readonly roomRepo: Repository<Room>,
		@Inject("INVITE_REPO") readonly inviteRepo: Repository<Invite>,
		@Inject("MEMBER_REPO") readonly memberRepo: Repository<Member>,
		@Inject("MESSAGE_REPO") readonly messageRepo: Repository<Message>,
		@Inject("GAMESTATE_REPO") readonly gamestateRepo: Repository<GameState>,
		// @Inject("TEAM_REPO") readonly teamRepo: Repository<Team>,
	) {
		ReceiverFinder.instance = this;
	}

	async get(subject: Subject, id: number, relations: FindOptionsRelations<any>): Promise<any> {
		return this.repo(subject).findOne({
			relations,
			where: { id	},
		});
	}

	repo(sub: Subject) {
		const repos = [
			{ subject: Subject.ROOM, repo: ReceiverFinder.instance.roomRepo },
			{ subject: Subject.INVITE, repo: ReceiverFinder.instance.inviteRepo },
			{ subject: Subject.MEMBER, repo: ReceiverFinder.instance.memberRepo },
			{ subject: Subject.MESSAGE, repo: ReceiverFinder.instance.messageRepo },
			{ subject: Subject.GAMESTATE, repo: ReceiverFinder.instance.gamestateRepo },
		];
		
		const { repo } = repos.find(({ subject }) => subject === sub);
	
		return repo;
	}
}
