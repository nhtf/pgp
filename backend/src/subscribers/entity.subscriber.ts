import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from "typeorm"
import { Action, Subject } from "src/enums"
import { UpdateGateway } from "src/gateways/update.gateway"
import { instanceToPlain } from "class-transformer"
import type { User } from "src/entities/User"
import type { Invite } from "src/entities/Invite"
import type { Room } from "src/entities/Room"
import type { Member } from "src/entities/Member"
import type { Message } from "src/entities/Message"
import type { Team } from "src/entities/Team"

type SubjectInfo = { subject: Subject, names: string[], fun: (any: any) => any[] };

// TODO: friends
const sub: SubjectInfo[] = [
	{ subject: Subject.USER, names: [ "User" ], fun: (_: User) => [] },
	{ subject: Subject.ROOM, names: [ "ChatRoom", "GameRoom" ], fun: (room: Room) => room.is_private ? room.users : [] },
	{ subject: Subject.INVITE, names: [ "Invite", "RoomInvite", "FriendRequest" ], fun: (invite: Invite) => [invite.from, invite.to] },
	{ subject: Subject.MEMBER, names: [ "ChatRoomMember", "GameRoomMember" ], fun: (member: Member) => member.room.users },
	{ subject: Subject.MESSAGE, names: [ "Message" ], fun: (message: Message) => message.room.users.filter((user) => user.activeRoomId === message.roomId) },
	// { subject: Subject.GAMESTATE, names: [ "Team" ], fun: (team: Team) => [] }
]

const ignoredColumns = [ "last_activity", "has_session", "activeRoom" ];

@EventSubscriber()
export class EntitySubscriber implements EntitySubscriberInterface {
	afterInsert(event: InsertEvent<any>) {
		console.log("Insert", event.metadata.targetName);

		const { subject, fun } = this.subjectEntry(event.metadata.targetName);
	
		if (!subject) {
			return ;
		}

		UpdateGateway.instance.send_update({
			subject,
			action: Action.ADD,
			id: event.entity.id,
			value: instanceToPlain(event.entity),
		}, ...fun(event.entity));
	}

	afterUpdate(event: UpdateEvent<any>) {
		const updatedColumns = [
			...this.names(event.updatedColumns),
			...this.names(event.updatedRelations)
		];
	
		if (!updatedColumns.some((column) => !ignoredColumns.includes(column))) {
			return ;
		}
	
		console.log("Update", event.metadata.targetName, updatedColumns);
	
		const { subject, fun } = this.subjectEntry(event.metadata.targetName);
		const entity = instanceToPlain(event.entity);
	
		if (!subject) {
			return ;
		}
		
		const value = updatedColumns.reduce((sum, column) => {
			if (entity[column]) {
				sum[column] = entity[column];
			}
			
			return sum;
		}, {});
	
		if (!Object.keys(value).length) {
			return ;
		}

		UpdateGateway.instance.send_update({
			subject,
			action: Action.SET,
			id: entity.id,
			value,
		}, ...fun(event.entity));
	}

	beforeRemove(event: RemoveEvent<any>) {
		console.log("Remove", event.metadata.targetName);
	
		const { subject, fun } = this.subjectEntry(event.metadata.targetName);

		if (!subject) {
			return ;
		}

		UpdateGateway.instance.send_update({
			subject,
			action: Action.REMOVE,
			id: event.entity.id,
		}, ...fun(event.entity));
	}

	subjectEntry(entityName: string) {
		return sub.find(({ names }) => names.includes(entityName)) ?? { subject: null, fun: () => []};
	}

	names<T extends { propertyName: string }>(columns: T[]) {
		return columns.map((column) => column.propertyName);
	}
}