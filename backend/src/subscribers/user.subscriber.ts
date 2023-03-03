import { EventSubscriber, EntitySubscriberInterface, UpdateEvent } from "typeorm"
import { User } from "src/entities/User"
import { UpdateGateway } from "src/gateways/update.gateway"
import { Subject } from "src/enums/Subject"
import { Action } from "src/enums/Action"
import { instanceToPlain } from "class-transformer";

const ignoredProperties = ["last_activity", "has_session"];

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
	listenTo() {
		return User;
	}

	afterUpdate(event: UpdateEvent<User>) {
		if (event.updatedColumns.some((column) => !ignoredProperties.includes(column.propertyName))) {
			console.log(event.updatedColumns.map((column) => column.propertyName));

			const user = event.entity;

			UpdateGateway.instance.send_update({
				subject: Subject.USER,
				id: user.id,
				action: Action.SET,
				value: instanceToPlain(user),
			});
		}
	}
}