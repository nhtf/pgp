import type { User } from "src/entities/User"
import type { Room } from "src/entities/Room"
import type { Invite } from "src/entities/Invite"
import type { Member } from "src/entities/Member"
import type { Message } from "src/entities/Message"
import type { GameState } from "src/entities/GameState"
import type { AchievementProgress } from "src/entities/AchievementProgress"
import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent, FindOptionsRelations } from "typeorm"
import { UpdateGateway } from "src/gateways/update.gateway"
import { ReceiverFinder } from "src/ReceiverFinder" 
import { instanceToPlain } from "class-transformer"
import { Action, Subject } from "src/enums"

type SubjectInfo = { subject: Subject, names: string[], fun: (any: any) => User[] | null, relations?: FindOptionsRelations<any> };

const subjects: SubjectInfo[] = [
	{ subject: Subject.USER, names: [ "User" ], fun: (_: User) => [] },
	{ subject: Subject.ACHIEVEMENT, names: [ "Achievement" ], fun: (ach: AchievementProgress) => [] },
	{ subject: Subject.ROOM, names: [ "Room", "ChatRoom", "GameRoom" ], fun: (room: Room) => room.is_private ? room.users?.length ? room.users : null : [] },
	{ subject: Subject.INVITE, names: [ "Invite", "RoomInvite", "FriendRequest" ], fun: (invite: Invite) => [invite.from, invite.to] },
	{ subject: Subject.MEMBER, names: [ "Member", "ChatRoomMember", "GameRoomMember" ],
		fun: (member: Member) => member.room?.users,
		relations: { room: { members: { user: true } } }
	},
	{ subject: Subject.MESSAGE, names: [ "Message" ],
		fun: (message: Message) => message.room?.users,
		relations: { room: { members: { user: true } } }
	},
	// TODO: check if used
	{ subject: Subject.GAMESTATE, names: [ "GameState" ],
		fun: (state: GameState) => state.room?.users,
		relations: { room: { members: { user: true }} }
	},
];

const ignoredColumns = [ 
	"last_activity", 
	"has_session",
	"activeRoom",
];

@EventSubscriber()
export class EntitySubscriber implements EntitySubscriberInterface {
	async afterInsert(event: InsertEvent<any>) {
		await this.update(event, Action.INSERT, (entity) => instanceToPlain(entity));
	}

	async afterUpdate(event: UpdateEvent<any>) {
		const updatedColumns = this.updatedNames(event);

		if (updatedColumns.length) {
			await this.update(event, Action.UPDATE, this.columnToEntity.bind({}, updatedColumns));
		}
	}

	async beforeRemove(event: RemoveEvent<any>) {
		await this.update(event, Action.REMOVE, () => undefined);
	}

	async update(event: any, action: Action, valueFun: (entity: any) => any) {
		const entity = event.entity;

		try {
			this.log(event, action);

			const info = this.subjectEntry(event.metadata.targetName);
			const value = valueFun(entity);		

			UpdateGateway.instance.send_update({
				subject: info.subject,
				action,
				id: entity.id,
				value,
			}, ...await this.receivers(entity, info));
		} catch (error) {
			// console.log(error);
		}
	}

	async receivers(entity: any, info: SubjectInfo): Promise<User[]> {
		let receivers = info.fun(entity);

		if (receivers === null) {
			throw new Error("No receivers");
		}

		if (receivers === undefined) {
			const entityWithRelations = await ReceiverFinder.instance.get(info.subject, entity.id, info.relations);

			receivers = info.fun(entityWithRelations);
		}

		if (!Array.isArray(receivers)) {
			receivers = [receivers];
		}

		return receivers;
	}

	subjectEntry(entityName: string): SubjectInfo {
		const info = subjects.find(({ names }) => names.includes(entityName));

		if (!info) {
			throw new Error("Ignored subject");			
		}

		return info;
	}

	columnToEntity(columns: string[], entity: any) {
		const plained = instanceToPlain(entity);
		const value = columns.reduce((sum, column) => {
			if (plained[column] !== undefined) {
				sum[column] = plained[column];
			}
			
			return sum;
		}, {});

		if (!Object.keys(value).length) {
			throw new Error("No public updates");
		}
		
		return value;
	}

	updatedNames(event: UpdateEvent<any>): string[] {
		return event.updatedColumns
			.map((column) => column.propertyName)
			.concat(event.updatedRelations
				.map((column) => column.propertyName))
			.filter((column) => !ignoredColumns.includes(column));
	}

	// TODO: remove
	log(event: any, action: Action) {
		const ignored = "score";
	
		if (action !== Action.UPDATE) {
			console.log(Action[action], event.metadata.name);
		} else {
			const updatedColumns = this.updatedNames(event);

			if (updatedColumns.every((column) => ignored.includes(column))) {
				return ;
			}
		
			console.log(Action[action], event.metadata.name, updatedColumns);
		}
	}
}
