import type { User } from "src/entities/User"
import type { Invite } from "src/entities/Invite"
import type { Room } from "src/entities/Room"
import type { Member } from "src/entities/Member"
import type { Message } from "src/entities/Message"
import type { Team } from "src/entities/Team"
import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent, FindOptionsRelations } from "typeorm"
import { Action, Subject } from "src/enums"
import { UpdateGateway } from "src/gateways/update.gateway"
import { instanceToPlain } from "class-transformer"
import { ReceiverFinder } from "src/ReceiverFinder" 

type SubjectInfo = { subject: Subject, names: string[], fun: (any: any) => User[], relations: FindOptionsRelations<any> };

// TODO: friends
const subjects: SubjectInfo[] = [
	{ subject: Subject.USER, names: [ "User" ], fun: (_: User) => [], relations: {} },
	{ subject: Subject.ROOM, names: [ "ChatRoom", "GameRoom" ], fun: (room: Room) => room.is_private ? room?.users : [], relations: { members: { user: true } } },
	{ subject: Subject.INVITE, names: [ "Invite", "RoomInvite", "FriendRequest" ], fun: (invite: Invite) => [invite.from, invite.to], relations: { to: true, from: true } },
	{ subject: Subject.MEMBER, names: [ "ChatRoomMember", "GameRoomMember" ], fun: (member: Member) => member.room?.users, relations: { room: { members: { user: true } } } },
	{ subject: Subject.MESSAGE, names: [ "Message" ], fun: (message: Message) => message.room?.users, relations: { room: { members: { user: true } } } },
	{ subject: Subject.TEAM, names: [ "Team" ], fun: (team: Team) => { 
			return team.state?.room?.users.concat(team.state?.room?.users?.map((user) => user.friends).flat());
		}, relations: { state: { room: { members: { user: { friends: true } } } } }
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
		await this.update(event, Action.ADD, (entity) => instanceToPlain(entity));
	}

	async afterUpdate(event: UpdateEvent<any>) {
		const updatedColumns = event.updatedColumns.map((column) => column.propertyName)
			.concat(event.updatedRelations.map((column) => column.propertyName))
			.filter((column) => !ignoredColumns.includes(column));

		if (updatedColumns.length) {
			console.log("Update", event.metadata.targetName, updatedColumns);
			await this.update(event, Action.SET, this.columnToEntity.bind({}, updatedColumns));
		}
	}

	async beforeRemove(event: RemoveEvent<any>) {
		await this.update(event, Action.REMOVE, () => undefined);
	}

	async update(event: any, action: Action, valueFun: (entity: any) => any) {
		const entity = event.entity;
	
		try {
			const info = this.subjectEntry(event.metadata.targetName);
		
			UpdateGateway.instance.send_update({
				subject: info.subject,
				action,
				id: entity.id,
				value: valueFun(entity)
			}, ...await this.receivers(entity, info));
		} catch (_) {}
	}

	async receivers(entity: any, info: SubjectInfo): Promise<User[]> {
		let receivers = info.fun(entity);

		if (!receivers) {
			const entityWithRelations = await ReceiverFinder.instance.get(info.subject, entity.id, info.relations);

			receivers = info.fun(entityWithRelations);
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
}
