import type { Member } from "src/entities/Member"
import { Repository } from "typeorm"
import { Inject } from "@nestjs/common";
import { Subject } from "src/enums"

export class ReceiverFinder {
	static instance: ReceiverFinder;

	constructor(@Inject("MEMBER_REPO") readonly memberRepo: Repository<Member>) {
		ReceiverFinder.instance = this;
	}

	async get(subject: Subject, entity: any): Promise<any> {
		switch (subject) {
			case Subject.MEMBER:
				const member = await this.memberRepo.findOne({
					where: {
						id: entity.id,
					},
					relations: {
						room: {
							members: {
								user: true,
							}
						}
					}
				});

				console.log("A", member);

				return member;
		}
	}
}